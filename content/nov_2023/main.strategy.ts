import { addLauncherSchema, addStrategySchema, Cache, listenDoneBacktest, Position, setConfig } from "backtest-kit";
import { scrapeLookback } from "telegram-reader";
import { memoize, str } from "functools-kit";
import {
  generateObject,
  InferenceName,
  type FormatModel,
} from "json-inference";
import { omit } from "lodash";
import { readFile } from "fs/promises";
import Mustache from "mustache";

setConfig({
  CC_MAX_STOPLOSS_DISTANCE_PERCENT: 100,
});

const CHANNEL_NAME = "WallstreetQueenOfficial" as const;

const FRESH_WINDOW_MINUTES = 15;
const NEVER_STOP_PERCENT = 50;

const getPrompt = memoize(
  ([symbol]) => `${symbol}`,
  async (symbol: string) => {
    const template = await readFile("./prompt.mustache", "utf-8");
    return Mustache.render(template, { symbol });
  },
);

const TradingPositionFormat = {
  type: "object",
  required: [
    "id",
    "symbol",
    "position",
    "entryRange",
    "targets",
    "stoploss",
    "reasoning",
  ],
  properties: {
    id: {
      type: "number",
      description: str.newline(
        "ID сообщения из которого был сформирован сигнал.",
        "Это число, пиши только его без строкового префикса ID, например, 2134.",
        "Если сигнала нет, верни -1",
      ),
    },
    symbol: {
      type: "string",
      description: str.newline(
        "Тикер позиции строго в формате *USDT, Например",
        "Текст Coin: #CELR/USDT преобразуем в CELRUSDT без # и /",
      ),
    },
    position: {
      type: "string",
      enum: ["long", "short", "wait"],
      description: str.newline(
        "Тип позиции long или short — направление словом:",
        "Long Set-Up / Short Set-Up.",
        "Если позиции нет, верни wait",
      ),
    },
    entryRange: {
      type: "object",
      description: str.newline(
        "Диапазон входа, например для 'Entry: 0.29360 - 0.27500$(Buy Partially)'",
        "верни from=0.29360, to=0.27500; аннотацию в скобках игнорируй.",
        "Если сигнала нет, верни from=0 и to=0",
      ),
      required: ["from", "to"],
      properties: {
        from: {
          type: "number",
          description: "Первая цена диапазона входа",
        },
        to: {
          type: "number",
          description: "Вторая цена диапазона входа",
        },
      },
    },
    targets: {
      type: "array",
      description: str.newline(
        "Цели из поля Targets — уровней бывает от 3 до 10 и больше, числа.",
        "Аннотации в скобках после цен игнорируй.",
        "Если сигнала нет, верни []",
      ),
      items: { type: "number" },
    },
    stoploss: {
      type: "number",
      description: str.newline(
        "СТОП ЛОСС, одна точка; пишется Stoploss / Stop loss / Stop-loss.",
        "Если сигнала нет, верни 0",
      ),
    },
    reasoning: {
      type: "string",
      description: str.newline(
        "Строковое описание почему ты сделал именно такое решение",
        "Будет использовано программистом для отладки",
      ),
    },
  },
} satisfies FormatModel;

const getSignal = Cache.file(
  async (symbol: string, when: Date) => {
    // База без USDT ловит все эры тегов канала: #ADA, #ADA/USDT, #ADAUSDT
    const coin = `#${symbol.replace("USDT", "")}`;

    let messages = await scrapeLookback({
      channel: CHANNEL_NAME,
      limit: FRESH_WINDOW_MINUTES,
      dimension: "minute",
      when,
    });

    messages = messages
      .filter(({ content }) => content.length > 0)
      .filter(({ content }) => content.includes(coin))
      // Сигнальная форма (вход И цель/стоп) - отчёты "Target done", апдейты и обзоры
      // не ходят в LLM; эвристика отвалидирована фингерпринт-сканом всех пяти эр
      .filter(({ content }) => /entry|buy zone|buy:|buy a bag|just buy|buying setup|market price|longing|shorting/i.test(content) && /target|take.?profit|stop/i.test(content));

    if (!messages.length) {
      return { entry: null };
    }

    {
      const [msg] = messages;
      console.log("Parsing: ", msg.content.slice(0, 64));
    }

    const entry = await generateObject(
      InferenceName.OllamaInference,
      {
        format: TradingPositionFormat,
        messages: [
          { role: "user", content: await getPrompt(symbol) },
          ...messages.map(({ id, channel, date, content }) => ({
            role: "user" as const,
            content: str.newline(
              `ID ${id}`,
              "",
              content,
              "",
              `[${date.toISOString()}]: https://t.me/${channel}/${id}`,
            ),
          })),
        ],
      },
      "gemma4:31b-cloud",
    );

    const message = messages.find((message) => message.id === entry.id)!;

    if (!message) {
      return { entry: null };
    }

    const url = `https://t.me/${message.channel}/${message.id}`;

    return { entry, message, url };
  },
  {
    interval: "5m",
    name: "wallstreet_queen_entry_v2"
  },
);

addStrategySchema({
  strategyName: "main_strategy",
  getSignal: async (symbol, when, currentPrice) => {

    console.log(symbol, when);

    const { entry, message, url } = await getSignal(symbol, when);

    if (!entry) {
      return null;
    }

    if (entry.position !== "long" && entry.position !== "short") {
      return null;
    }

    if (when.getTime() - new Date(message.date).getTime() > FRESH_WINDOW_MINUTES * 60_000) {
      return null;
    }

    const info = { symbol, entry, url, message: omit(message, "photo") };

    return {
      id: `${entry.id}-${entry.symbol.toLowerCase()}`,
      symbol: entry.symbol,
      ...Position.moonbag({
        position: entry.position,
        currentPrice,
        percentStopLoss: NEVER_STOP_PERCENT,
      }),
      note: JSON.stringify(info, null, 2),
      minuteEstimatedTime: 24 * 60,
    };
  },
});

declare var kill: any;

listenDoneBacktest(() => kill());

addLauncherSchema({
  launcherName: "main_launcher",
  backtest: true,
  symbolList: [
    "1INCHUSDT",
    "APTUSDT",
    "BELUSDT",
    "ETHUSDT",
    "IDEXUSDT",
    "PLANETUSDT",
    "RENUSDT",
    "RLCUSDT",
    "SKLUSDT",
    "TRUUSDT",
    "ZECUSDT",
  ],
})
