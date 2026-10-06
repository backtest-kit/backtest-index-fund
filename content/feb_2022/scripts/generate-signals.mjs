// Offline-генерация сигналов канала без backtest-kit:
// читает ./assets/messages.jsonl, гоняет LLM-пайплайн стратегии (prompt.mustache +
// схема, скопированная из main.test.ts) и пишет ./assets/signals.jsonl построчно.
// Запуск: node generate-signals.mjs (из папки месяца) или из корня репо:
//   node content/<месяц>/generate-signals.mjs
// Пути берутся от файла скрипта, cwd не важен. Скрипт резюмится: уже обработанные
// пары id_symbol пропускаются — прерывание не теряет сделанную работу.
// В signals.jsonl пишутся ВСЕ вердикты модели (long/short/wait) — wait нужен
// для резюма и аудита промпта; потребитель фильтрует по entry.position.
import { readFileSync, appendFileSync, existsSync, createReadStream } from "fs";
import { createInterface } from "readline";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Mustache from "mustache";
import { str } from "functools-kit";
import { generateObject, InferenceName } from "json-inference";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES_FILE = join(DIR, "assets", "messages.jsonl");
const SIGNALS_FILE = join(DIR, "assets", "signals.jsonl");
const PROMPT_TEMPLATE = readFileSync(join(DIR, "prompt.mustache"), "utf8");

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
        "Текст #ADA/USDT (или COIN NAME: #BNX/USDT, или голый #GMT)",
        "преобразуем в ADAUSDT без # и /",
      ),
    },
    position: {
      type: "string",
      enum: ["long", "short", "wait"],
      description: str.newline(
        "Тип позиции long или short — направление словом в заголовке:",
        "LONG SET-UP / SHORT SET-UP; SPOT CALL — это long.",
        "Если позиции нет, верни wait",
      ),
    },
    entryRange: {
      type: "object",
      description: str.newline(
        "Диапазон входа, например для 'Entry: 2.24 - 2.20$(Buy partially)'",
        "верни from=2.24, to=2.20; аннотацию в скобках игнорируй.",
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
        "Цели из поля Target/Targets — уровней бывает от 3 до 10 и больше, числа.",
        "Аннотации в скобках после цен игнорируй.",
        "Если сигнала нет, верни []",
      ),
      items: { type: "number" },
    },
    stoploss: {
      type: "number",
      description: str.newline(
        "СТОП ЛОСС, одна точка; пишется Stoploss / Stop loss / STOP LOSS.",
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
};

// Сигнальная форма (вход И цель/стоп) — тот же фильтр, что в main.test.ts
const ENTRY_RE = /entry|buy zone|buy:|buy a bag|just buy|buying setup|market price|longing|shorting/i;
const LEVELS_RE = /target|take.?profit|stop/i;

// Кандидаты-тикеры из тегов поста: #ADA, #ADA/USDT, #ADAUSDT -> ADAUSDT
const candidates = (content) => {
  const out = new Set();
  for (const m of content.matchAll(/#([A-Z0-9]{2,12})(?:\/USDT|USDT)?\b/g)) {
    let base = m[1];
    if (base.endsWith("USDT")) base = base.slice(0, -4);
    if (base.length >= 2 && /[A-Z]/.test(base)) out.add(base + "USDT");
  }
  return [...out];
};

// jsonl читаем ТОЛЬКО построчно стримом: в messages.jsonl лежат base64-фото,
// целиком файл в память не поднимаем никогда
const eachLine = async (file, onRow) => {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    onRow(JSON.parse(line));
  }
};

// Резюм: пары id_symbol, уже записанные в signals.jsonl
const done = new Set();
if (existsSync(SIGNALS_FILE)) {
  await eachLine(SIGNALS_FILE, (row) => done.add(`${row.messageId}_${row.symbol}`));
}

// Фото выбрасывается сразу при чтении строки — в work живёт только текст
const work = [];
let total = 0;
await eachLine(MESSAGES_FILE, (row) => {
  total++;
  const { photo, ...msg } = row;
  const content = msg.content || "";
  if (!content.length) return;
  if (!(ENTRY_RE.test(content) && LEVELS_RE.test(content))) return;
  for (const symbol of candidates(content)) {
    work.push({ msg, symbol });
  }
});

console.log(`сообщений: ${total}, пар пост-тикер после фильтра: ${work.length}, уже сделано: ${done.size}`);

let n = 0;
for (const { msg, symbol } of work) {
  n++;
  const key = `${msg.id}_${symbol}`;
  if (done.has(key)) {
    continue;
  }
  const url = `https://t.me/${msg.channel}/${msg.id}`;
  const entry = await generateObject(
    InferenceName.OllamaInference,
    {
      format: TradingPositionFormat,
      messages: [
        { role: "user", content: Mustache.render(PROMPT_TEMPLATE, { symbol }) },
        {
          role: "user",
          content: str.newline(
            `ID ${msg.id}`,
            "",
            msg.content,
            "",
            `[${new Date(msg.date).toISOString()}]: ${url}`,
          ),
        },
      ],
    },
    "gemma4:31b-cloud",
  );
  appendFileSync(
    SIGNALS_FILE,
    JSON.stringify({ messageId: msg.id, symbol, entry, url, message: msg }) + "\n",
  );
  console.log(`[${n}/${work.length}] id=${msg.id} ${symbol} -> ${entry.position}`);
}

console.log("готово:", SIGNALS_FILE);
process.exit(0);
