import {
  addLauncherSchema,
  addStrategySchema,
  Cache,
  getCandles,
  listenDoneBacktest,
  Position,
  setConfig,
} from "backtest-kit";

setConfig({
  CC_MAX_STOPLOSS_DISTANCE_PERCENT: 100, // иначе валидатор не пропустит технический стоп -50%
  // Свечи дневные с Yahoo, минутки семплированы и внутри дня одинаковы: позиции оцениваются
  // раз в сутки вместо поминутного цикла. Каденция тиков стратегии остаётся по интервалу фрейма.
  CC_BACKTEST_STEP_MINUTES: 24 * 60,
});

// Депозит делится поровну между тикерами корзины; доля депозита вне корзины паркуется в золото
const DEPOSIT_USD = 1000;
const PARKING_SYMBOL = "PAXGUSDT";

// Позиция живёт ровно неделю и закрывается по времени; перезаход на первом тике после закрытия.
// Минус одна минута: закрытие в 23:59, перезаход на часовом тике 00:00, без лишнего часа в кэше.
const HOLD_MINUTES = 7 * 24 * 60 - 1;

// Трендовый гейт по BTC: доля окон 20..45 дней с положительной доходностью BTC. Это экспозиция
// корзины от 0 до 1; остаток уходит в PARKING_SYMBOL. Ансамбль окон вместо одного N: одиночные
// окна за пределами 25..45 дней заметно хуже, внутри плато результат от выбора N не зависит.
const GATE_SYMBOL = "BTCUSDT";
const GATE_WINDOWS_DAYS = [20, 25, 30, 35, 40, 45];

// Технические уровни: за неделю на споте без плеча недостижимы, штатный выход только по времени
const STOP_LOSS_PERCENT = 50;
const TAKE_PROFIT_PERCENT = 500;

// BASKET:BEGIN
// Февраль 2025: топ-20 USDT-пар спота Binance по обороту за январь 2025 (известен до начала месяца),
// листинг не моложе 90 дней, без стейблкоинов, плечевых токенов и обёрток BTC/ETH.
// Сгенерировано scripts/common/generate_months.mjs из scripts/common/universe.json.
const BASKET = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "DOGEUSDT",
  "SUIUSDT",
  "ADAUSDT",
  "TRXUSDT",
  "BNBUSDT",
  "LINKUSDT",
  "HBARUSDT",
  "ENAUSDT",
  "LTCUSDT",
  "XLMUSDT",
  "WLDUSDT",
  "WIFUSDT",
  "AAVEUSDT",
  "AVAXUSDT",
  "SHIBUSDT",
  "TAOUSDT",
];
// BASKET:END

const SYMBOL_LIST = [...BASKET, PARKING_SYMBOL];
const PER_SYMBOL_USD = DEPOSIT_USD / BASKET.length;

// getCandles внутри getSignal обрезан по времени движка: последняя дневная свеча - последний
// закрытый день, заглядывания вперёд нет. Cache.fn с интервалом 1d считает гейт один раз
// в день на все тикеры и сам инвалидируется при переходе движка на следующий день.
const getGate = Cache.fn(async (): Promise<number> => {
  const candles = await getCandles(GATE_SYMBOL, "1d", Math.max(...GATE_WINDOWS_DAYS) + 1);
  const closes = candles.map(({ close }) => close);
  const last = closes[closes.length - 1];
  const up = GATE_WINDOWS_DAYS.filter((days) => last > closes[closes.length - 1 - days]).length;
  return up / GATE_WINDOWS_DAYS.length;
}, { interval: "1d" });

addStrategySchema({
  strategyName: "index_fund",
  interval: "1h",
  getSignal: async (symbol, when, currentPrice) => {

    const gate = await getGate();

    const cost = symbol === PARKING_SYMBOL
      ? DEPOSIT_USD * (1 - gate)
      : PER_SYMBOL_USD * gate;

    // cost: 0 движок молча заменяет на CC_POSITION_ENTRY_COST, поэтому нулевая доля - это отсутствие сигнала
    if (cost < 1) {
      return null;
    }

    return {
      id: `${symbol.toLowerCase()}-${when.toISOString().slice(0, 10)}`,
      symbol,
      ...Position.bracket({
        position: "long",
        currentPrice,
        percentStopLoss: STOP_LOSS_PERCENT,
        percentTakeProfit: TAKE_PROFIT_PERCENT,
      }),
      cost: Math.round(cost * 100) / 100,
      minuteEstimatedTime: HOLD_MINUTES,
      payload: { gate, weight: cost / DEPOSIT_USD, basketSize: BASKET.length },
      note: `${symbol} gate=${gate.toFixed(2)} cost=$${cost.toFixed(2)}`,
    };
  },
});

declare var kill: any;

// listenDoneBacktest срабатывает на каждый символ списка: процесс завершаем после последнего
let doneCount = 0;

listenDoneBacktest(() => {
  doneCount += 1;
  if (doneCount >= SYMBOL_LIST.length) {
    kill();
  }
});

addLauncherSchema({
  launcherName: "main_launcher",
  backtest: true,
  symbolList: SYMBOL_LIST,
  cache: false,
})
