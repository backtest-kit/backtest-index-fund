import {
  addExchangeSchema,
  addFrameSchema,
  getCandlesFilled,
  getCandlesSampled,
  PersistCandleAdapter,
} from "backtest-kit";

import { YahooFinance } from "../classes/YahooFinance";

// Символ стратегии -> тикер Yahoo: BTCUSDT -> BTC-USD. У части монет Yahoo держит тикер с числовым
// суффиксом (одноимённые токены), такие исключения перечислены явно.
const TICKER_OVERRIDES: Record<string, string> = {
  PEPEUSDT: "PEPE24478-USD",
  SUIUSDT: "SUI20947-USD",
  TAOUSDT: "TAO22974-USD",
  FTMUSDT: "WFTM-USD",
  SAGAUSDT: "SAGA30372-USD",
};

const tickerOf = (symbol: string): string =>
  TICKER_OVERRIDES[symbol] ?? symbol.replace(/USDT$/, "-USD");

const fetchOHLCV = (symbol: string, interval: string, since: number, limit: number) =>
  YahooFinance.getCandles(tickerOf(symbol), interval, since, limit);

// Yahoo отдаёт только дневные бары. Дневные запросы идут через getCandlesFilled (дыры заполняются
// плоской свечой по последнему закрытию), всё короче дня - через getCandlesSampled, который
// размножает дневной бар на минуты и часы. Семплер требует интервал строго меньше нативного,
// поэтому для 1d ветка отдельная.
addExchangeSchema({
  exchangeName: "yahoo-finance",
  getCandles: async (symbol, interval, since, limit) => {
    if (interval === "1d") {
      return await getCandlesFilled(fetchOHLCV, { symbol, interval, since, limit });
    }
    return await getCandlesSampled(fetchOHLCV, { symbol, interval, since, limit });
  },
});

// Семплированные свечи генерируются из памяти: в Mongo их не пишем и не читаем
PersistCandleAdapter.useDummy();

addFrameSchema({
  frameName: "oct_2024_frame",
  interval: "1h",
  startDate: new Date("2024-10-01T00:00:00Z"),
  endDate: new Date("2024-10-31T23:59:59Z"),
  note: "October 2024",
});
