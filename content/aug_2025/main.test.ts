import { addLauncherSchema, addStrategySchema, getCandles, listenDoneBacktest, Position, setConfig } from "backtest-kit";
import { omit } from "lodash";

import { Dataset } from "./classes/Dataset";

setConfig({
  CC_MAX_STOPLOSS_DISTANCE_PERCENT: 100,
});

const FRESH_WINDOW_MINUTES = 15;
const NEVER_STOP_PERCENT = 50;

addStrategySchema({
  strategyName: "main_strategy",
  getSignal: async (symbol, when, currentPrice) => {

    console.log(symbol, when);

    const signal = await Dataset.getSignal(symbol, when);

    if (!signal) {
      return null;
    }

    const { entry, message, url } = signal;

    if (entry.symbol !== symbol) {
      return null;
    }

    if (entry.position !== "long" && entry.position !== "short") {
      return null;
    }

    if (when.getTime() - new Date(message.date).getTime() > FRESH_WINDOW_MINUTES * 60_000) {
      return null;
    }

    const info = { symbol, entry, url, message: omit(message, "photo") };

    const [{ low, high }] = await getCandles(symbol, "1m", 1);

    const minPrice = Math.min(entry.entryRange.from, entry.entryRange.to);
    const maxPrice = Math.max(entry.entryRange.from, entry.entryRange.to);

    if (high < minPrice || low > maxPrice) {
      return null;
    }

    if (!entry.targets[2]) {
      return null;
    }

    return {
      id: `${entry.id}-${entry.symbol.toLowerCase()}`,
      symbol: entry.symbol,
      position: entry.position,
      priceStopLoss: entry.stoploss,
      priceTakeProfit: entry.position === "long"
        ? Math.max(...entry.targets)
        : Math.min(...entry.targets),
      payload: info,
      minuteEstimatedTime: 3 * 24 * 60,
      note: JSON.stringify(info, null, 2),
    };
  },
});

declare var kill: any;

listenDoneBacktest(() => kill());

addLauncherSchema({
  launcherName: "main_launcher",
  backtest: true,
  symbolList: [
    "ACXUSDT",
    "ADAUSDT",
    "AIUSDT",
    "ARBUSDT",
    "AXLUSDT",
    "BRETTUSDT",
    "CELRUSDT",
    "COMPUSDT",
    "DFUSDT",
    "ENAUSDT",
    "HEIUSDT",
    "IMXUSDT",
    "KNCUSDT",
    "MLNUSDT",
    "OBOLUSDT",
    "OMUSDT",
    "SANTOSUSDT",
    "SNXUSDT",
    "TRXUSDT",
    "USTCUSDT",
    "VETUSDT",
    "XLMUSDT",
    "ZECUSDT",
  ],
})
