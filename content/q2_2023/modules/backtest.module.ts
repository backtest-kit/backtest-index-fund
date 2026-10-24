import {
  addExchangeSchema,
  addFrameSchema,
  getCandlesSampled,
  PersistCandleAdapter,
} from "backtest-kit";

import { YahooFinance } from "../classes/YahooFinance";

// Символ стратегии -> тикер Yahoo: BTCUSDT -> BTC-USD. У части монет Yahoo держит тикер с числовым
// суффиксом (одноимённые токены), такие исключения перечислены явно.
const TICKER_OVERRIDES: Record<string, string> = {
  MATICUSDT: "WMATIC-USD",
  FTMUSDT: "WFTM-USD",
  MASKUSDT: "MASK8536-USD",
  APTUSDT: "APT21794-USD",
  STXUSDT: "STX4847-USD",
};

const tickerOf = (symbol: string): string =>
  TICKER_OVERRIDES[symbol] ?? symbol.replace(/USDT$/, "-USD");

const fetchOHLCV = (symbol: string, interval: string, since: number, limit: number) =>
  YahooFinance.getCandles(tickerOf(symbol), interval, since, limit);

// Yahoo отдаёт только дневные бары. getCandlesSampled размножает дневной бар на минуты и часы,
// дневные запросы отдаёт как есть через getCandlesFilled: сетка, дыры выходных и битые бары
// чинятся в ядре плоской свечой по соседям.
addExchangeSchema({
  exchangeName: "yahoo-finance",
  getCandles: async (symbol, interval, since, limit) =>
    await getCandlesSampled(fetchOHLCV, { symbol, interval, since, limit }),
});

// Семплированные свечи генерируются из памяти: в Mongo их не пишем и не читаем
PersistCandleAdapter.useDummy();

addFrameSchema({
  frameName: "q2_2023_frame",
  interval: "1h",
  // Свечи дневные с Yahoo, минутки семплированы и внутри дня одинаковы: позиция оценивается
  // раз в сутки вместо поминутного цикла. Каденция тиков стратегии остаётся часовой.
  watchInterval: "1d",
  startDate: new Date("2023-04-01T00:00:00Z"),
  endDate: new Date("2023-06-30T23:59:59Z"),
  note: "Q2 2023: April - June",
});
