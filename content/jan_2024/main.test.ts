import { addLauncherSchema, addStrategySchema, listenDoneBacktest, Position, setConfig } from "backtest-kit";
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

    return {
      id: `${entry.id}-${entry.symbol.toLowerCase()}`,
      symbol: entry.symbol,
      ...Position.moonbag({
        position: entry.position,
        currentPrice,
        percentStopLoss: NEVER_STOP_PERCENT,
      }),
      note: JSON.stringify(info, null, 2),
      minuteEstimatedTime: 3 * 24 * 60,
    };
  },
});

declare var kill: any;

listenDoneBacktest(() => kill());

addLauncherSchema({
  launcherName: "main_launcher",
  backtest: true,
  symbolList: [
    "ANKRUSDT",
    "ATOMUSDT",
    "AVAXUSDT",
    "BALUSDT",
    "BNBUSDT",
    "CHZUSDT",
    "CTSIUSDT",
    "GRTUSDT",
    "GTCUSDT",
    "HBARUSDT",
    "IOTXUSDT",
    "ROSEUSDT",
    "RUNEUSDT",
    "XLMUSDT",
    "XRPUSDT",
    "XTZUSDT",
    "YFIUSDT",
  ],
})
