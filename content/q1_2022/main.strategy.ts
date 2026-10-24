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
});

// Депозит делится поровну между тикерами корзины; доля депозита вне корзины паркуется в золото
const DEPOSIT_USD = 1000;
const PARKING_SYMBOL = "PAXGUSDT";

// Позиция живёт до конца календарного квартала: вход на первом тике, выход по времени в 23:59
// последнего дня квартала. Срок считается от момента входа, поэтому и перезаход после стопа
// закрывается в ту же минуту; на конец фрейма ядра не полагаемся.
const quarterEndOf = (when: Date): number => {
  const endMonth = when.getUTCMonth() - (when.getUTCMonth() % 3) + 3;
  return Date.UTC(when.getUTCFullYear(), endMonth, 1) - 60_000;
};
const holdMinutesOf = (when: Date): number => Math.floor((quarterEndOf(when) - when.getTime()) / 60_000);
// Короче часа до конца квартала не входим: ядру нечего держать
const MIN_HOLD_MINUTES = 60;

// Трендовый гейт по BTC: доля окон 20..45 дней с положительной доходностью BTC. Это экспозиция
// корзины от 0 до 1; остаток уходит в PARKING_SYMBOL. Ансамбль окон вместо одного N: одиночные
// окна за пределами 25..45 дней заметно хуже, внутри плато результат от выбора N не зависит.
const GATE_SYMBOL = "BTCUSDT";
const GATE_WINDOWS_DAYS = [20, 25, 30, 35, 40, 45];

// Технические уровни: за квартал на споте без плеча стоп -50% достижим только в обвале, штатный выход по времени
const STOP_LOSS_PERCENT = 50;
const TAKE_PROFIT_PERCENT = 2000; // +500% за квартал достижим (ADA, BNB в Q1 2021), тейк должен оставаться техническим

// BASKET:BEGIN
// Q1 2022 (январь - март): топ-20 USDT-пар спота Binance по обороту за декабрь 2021 (известен до начала квартала),
// листинг не моложе 90 дней, без стейблкоинов, плечевых токенов и обёрток BTC/ETH.
// Сгенерировано scripts/common/generate_months.mjs из scripts/common/universe.json.
const BASKET = [
  "BTCUSDT",
  "ETHUSDT",
  "MATICUSDT",
  "BNBUSDT",
  "SANDUSDT",
  "SHIBUSDT",
  "AVAXUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "DOTUSDT",
  "ADAUSDT",
  "FTMUSDT",
  "NEARUSDT",
  "DOGEUSDT",
  "MANAUSDT",
  "TRXUSDT",
  "FILUSDT",
  "LINKUSDT",
  "ATOMUSDT",
  "CRVUSDT",
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

    const holdMinutes = holdMinutesOf(when);
    if (holdMinutes < MIN_HOLD_MINUTES) {
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
      minuteEstimatedTime: holdMinutes,
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
