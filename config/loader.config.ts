import { waitForInit } from "@backtest-kit/mongo";
import {
  Live,
  Backtest,
  cacheCandles,
  listExchangeSchema,
  listFrameSchema,
  listStrategySchema,
  waitForReady,
} from "backtest-kit";
import { parseArgs } from "util";

const SYMBOL_LIST = [
  // Символы сигналов WallstreetQueenOfficial с ПОЛНЫМ покрытием 1m-свечами
  // на всём диапазоне бэктеста 07.05.2021-30.09.2026 (82 из 131 активных):
  // первая свеча не позже 07.05.2021, без внутренних разрывов, живы по сей день
  // (проверка дневными клинами ccxt как прокси минутных окон).
  // Выбыли: 48 поздних листингов (APT, ARB, OP, NOT, JUP, WLD, SEI...) и CVC (разрыв 12.2022).
  "1INCHUSDT",
  "AAVEUSDT",
  "ADAUSDT",
  "ALGOUSDT",
  "ALICEUSDT",
  "ANKRUSDT",
  "ARPAUSDT",
  "ATOMUSDT",
  "AUDIOUSDT",
  "AVAUSDT",
  "AVAXUSDT",
  "AXSUSDT",
  "BANDUSDT",
  "BATUSDT",
  "BCHUSDT",
  "BELUSDT",
  "BNBUSDT",
  "CAKEUSDT",
  "CELOUSDT",
  "CELRUSDT",
  "CFXUSDT",
  "CHRUSDT",
  "CHZUSDT",
  "CKBUSDT",
  "COMPUSDT",
  "COTIUSDT",
  "CRVUSDT",
  "CTKUSDT",
  "CTSIUSDT",
  "DASHUSDT",
  "DGBUSDT",
  "DOGEUSDT",
  "DOTUSDT",
  "DUSKUSDT",
  "EGLDUSDT",
  "ENJUSDT",
  "ETCUSDT",
  "ETHUSDT",
  "FILUSDT",
  "GRTUSDT",
  "HBARUSDT",
  "HOTUSDT",
  "INJUSDT",
  "IOSTUSDT",
  "IOTAUSDT",
  "IOTXUSDT",
  "KAVAUSDT",
  "KNCUSDT",
  "KSMUSDT",
  "LINKUSDT",
  "LTCUSDT",
  "MANAUSDT",
  "MTLUSDT",
  "NEARUSDT",
  "NEOUSDT",
  "ONEUSDT",
  "ONTUSDT",
  "QTUMUSDT",
  "RLCUSDT",
  "ROSEUSDT",
  "RSRUSDT",
  "RUNEUSDT",
  "RVNUSDT",
  "SANDUSDT",
  "SFPUSDT",
  "SKLUSDT",
  "SNXUSDT",
  "SOLUSDT",
  "SUSHIUSDT",
  "THETAUSDT",
  "TLMUSDT",
  "TRBUSDT",
  "TRXUSDT",
  "UNIUSDT",
  "VETUSDT",
  "XLMUSDT",
  "XRPUSDT",
  "XTZUSDT",
  "YFIUSDT",
  "ZECUSDT",
  "ZENUSDT",
  "ZRXUSDT",
];

Object.assign(globalThis, { SYMBOL_LIST });

const CACHE_CANDLES_FN = async () => {
  const [exchangeSchema] = await listExchangeSchema();
  const [frameSchema] = await listFrameSchema();
  for (const symbol of SYMBOL_LIST) {
    await cacheCandles({
      exchangeName: exchangeSchema.exchangeName,
      from: frameSchema.startDate,
      to: frameSchema.endDate,
      interval: "1m",
      symbol,
    });
  }
};

const main = async () => {
  const { values } = parseArgs({
    args: process.argv,
    options: {
      entry: {
        type: "boolean",
        default: false,
      },
      backtest: {
        type: "boolean",
        default: false,
      },
      live: {
        type: "boolean",
        default: false,
      },
      paper: {
        type: "boolean",
        default: false,
      },
      cache: {
        type: "boolean",
        default: false,
      },
    },
    strict: false,
    allowPositionals: true,
  });

  if (!values.entry) {
    return;
  }

  await waitForInit();
  await waitForReady(!!values.backtest);

  const [strategySchema] = await listStrategySchema();

  if (!strategySchema) {
    throw new Error("Strategy not specified");
  }

  const [exchangeSchema] = await listExchangeSchema();

  if (!exchangeSchema) {
    throw new Error("Exchange not specified");
  }

  const [frameSchema] = await listFrameSchema();

  if (values.backtest && !frameSchema) {
    throw new Error("Frame not specified");
  }

  if (values.cache && !frameSchema) {
    throw new Error("Frame not specified");
  }

  if (values.backtest && values.cache) {
    await CACHE_CANDLES_FN();
  }

  for (const symbol of SYMBOL_LIST) {
    if (values.live) {
      Live.background(symbol, {
        exchangeName: exchangeSchema.exchangeName,
        strategyName: strategySchema.strategyName,
      });
      continue;
    }
    if (values.paper) {
      Live.background(symbol, {
        exchangeName: exchangeSchema.exchangeName,
        strategyName: strategySchema.strategyName,
      });
      continue;
    }
    if (values.backtest) {
      Backtest.background(symbol, {
        exchangeName: exchangeSchema.exchangeName,
        strategyName: strategySchema.strategyName,
        frameName: frameSchema.frameName,
      });
      continue;
    }
  }
};

main();

export default async () => {
  await waitForInit();
}
