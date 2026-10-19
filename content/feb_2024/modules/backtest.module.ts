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
  SUIUSDT: "SUI20947-USD",
  MATICUSDT: "WMATIC-USD",
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
  frameName: "feb_2024_frame",
  interval: "1h",
  startDate: new Date("2024-02-01T00:00:00Z"),
  endDate: new Date("2024-02-29T23:59:59Z"),
  note: "February 2024",
});
