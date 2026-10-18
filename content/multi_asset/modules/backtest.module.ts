import {
  addExchangeSchema,
  addFrameSchema,
  getCandlesFilled,
  getCandlesSampled,
  PersistCandleAdapter,
} from "backtest-kit";

import { YahooFinance } from "../classes/YahooFinance";

// Символ стратегии -> тикер Yahoo. Один инструмент на класс активов: крипта, золото, акции, длинные облигации.
const TICKERS: Record<string, string> = {
  BTCUSD: "BTC-USD", // с сентября 2014
  GOLD: "GC=F",      // фьючерс COMEX, непрерывный контракт
  SPX: "^GSPC",      // индекс S&P 500
  TLT: "TLT",        // ETF длинных казначейских облигаций
};

const fetchOHLCV = (symbol: string, interval: string, since: number, limit: number) => {
  const ticker = TICKERS[symbol];
  if (!ticker) {
    throw new Error(`multi-asset-yahoo: unknown symbol ${symbol}, expected one of ${Object.keys(TICKERS).join(", ")}`);
  }
  return YahooFinance.getCandles(ticker, interval, since, limit);
};

// Yahoo отдаёт только дневные бары. Дневные запросы идут через getCandlesFilled (дыры выходных и
// праздников заполняются плоской свечой по последнему закрытию), всё короче дня - через
// getCandlesSampled, который размножает дневной бар на минуты и часы. Семплер требует интервал
// строго меньше нативного, поэтому для 1d ветка отдельная. Внутри дня у таких свечей нет движения,
// и стратегия ставит CC_BACKTEST_STEP_MINUTES на сутки: одна оценка в день.
addExchangeSchema({
  exchangeName: "multi-asset-yahoo",
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
  frameName: "multi_asset_frame",
  interval: "1d",
  startDate: new Date("2015-01-05T00:00:00Z"),
  endDate: new Date("2026-09-30T23:59:59Z"),
  note: "2015-2026: BTC, gold, S&P 500, TLT; daily ticks, weekly rebalance",
});
