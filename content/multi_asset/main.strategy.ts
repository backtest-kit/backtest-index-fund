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
  // Источник отдаёт только дневные бары, минутки семплированы и внутри дня одинаковы:
  // позиции оцениваются раз в сутки вместо поминутного цикла, бэктест быстрее на три порядка
  CC_BACKTEST_STEP_MINUTES: 24 * 60,
});

// Мультиактивный портфель: по одному инструменту на класс активов. Диверсификация живёт на уровне
// классов, недельные корреляции с BTC за 2017-2026: золото 0.12, S&P 0.23, TLT 0.02.
const SYMBOLS = ["BTCUSD", "GOLD", "SPX", "TLT"];
const CRYPTO_SYMBOLS = ["BTCUSD"];

const DEPOSIT_USD = 1000;

// Позиция живёт неделю и закрывается по времени; перезаход на следующем дневном тике с новыми весами.
// Минус одна минута: закрытие в 23:59, а не в 00:00, иначе дневной тик 00:00 уже пройден и
// портфель каждую неделю стоял бы сутки в кэше до следующего тика.
const HOLD_MINUTES = 7 * 24 * 60 - 1;

// Веса: равный вклад в риск (ERC) по ковариации дневных доходностей за окно. Учитывается ковариация,
// а не только волатильность каждого актива, иначе коррелирующие ноги получили бы суммарно больший риск.
const COV_WINDOW_DAYS = 90;

// Трендовый гейт по BTC на крипто-ногу: доля окон 20..45 дней с положительной доходностью.
// Вес крипты умножается на гейт, освободившаяся доля раздаётся остальным классам пропорционально их весам.
const GATE_SYMBOL = "BTCUSD";
const GATE_WINDOWS_DAYS = [20, 25, 30, 35, 40, 45];

// Технические уровни: за неделю недостижимы, штатный выход только по времени
const STOP_LOSS_PERCENT = 50;
const TAKE_PROFIT_PERCENT = 500;

const dailyLogReturns = async (symbol: string): Promise<number[]> => {
  const candles = await getCandles(symbol, "1d", COV_WINDOW_DAYS + 1);
  const out: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    out.push(Math.log(candles[i].close / candles[i - 1].close));
  }
  return out;
};

const covariance = (series: number[][]): number[][] => {
  const n = series.length;
  const length = Math.min(...series.map((s) => s.length));
  const means = series.map((s) => s.slice(-length).reduce((a, b) => a + b, 0) / length);
  const cov = series.map(() => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let sum = 0;
      const a = series[i].slice(-length);
      const b = series[j].slice(-length);
      for (let k = 0; k < length; k++) {
        sum += (a[k] - means[i]) * (b[k] - means[j]);
      }
      cov[i][j] = cov[j][i] = sum / (length - 1);
    }
  }
  return cov;
};

// Equal risk contribution: итеративно подтягиваем вес каждого актива к равному вкладу w_i * (Σw)_i
const equalRiskWeights = (cov: number[][]): number[] => {
  const n = cov.length;
  let w = new Array<number>(n).fill(1 / n);
  for (let iteration = 0; iteration < 500; iteration++) {
    const marginal = w.map((_, i) => cov[i].reduce((sum, c, j) => sum + c * w[j], 0));
    const contributions = w.map((wi, i) => wi * marginal[i]);
    const target = contributions.reduce((a, b) => a + b, 0) / n;
    const next = w.map((wi, i) => wi * Math.sqrt(target / Math.max(contributions[i], 1e-18)));
    const total = next.reduce((a, b) => a + b, 0);
    w = next.map((x) => x / total);
    const spread = Math.max(...contributions) - Math.min(...contributions);
    if (spread < target * 1e-6) {
      break;
    }
  }
  return w;
};

const getGate = async (): Promise<number> => {
  const candles = await getCandles(GATE_SYMBOL, "1d", Math.max(...GATE_WINDOWS_DAYS) + 1);
  const closes = candles.map(({ close }) => close);
  const last = closes[closes.length - 1];
  const up = GATE_WINDOWS_DAYS.filter((days) => last > closes[closes.length - 1 - days]).length;
  return up / GATE_WINDOWS_DAYS.length;
};

// getCandles внутри getSignal обрезан по времени движка, заглядывания вперёд нет. Cache.fn с интервалом 1d:
// веса считаются один раз в день на все символы и инвалидируются при переходе движка на следующий день.
const getWeights = Cache.fn(async (): Promise<{ weights: Record<string, number>; gate: number; raw: Record<string, number> }> => {
  const series = await Promise.all(SYMBOLS.map(dailyLogReturns));
  const erc = equalRiskWeights(covariance(series));
  const raw = Object.fromEntries(SYMBOLS.map((symbol, i) => [symbol, erc[i]]));
  const gate = await getGate();
  const cryptoWeight = CRYPTO_SYMBOLS.reduce((sum, symbol) => sum + raw[symbol], 0);
  const otherWeight = 1 - cryptoWeight;
  const freed = cryptoWeight * (1 - gate);
  const weights = Object.fromEntries(SYMBOLS.map((symbol) => [
    symbol,
    CRYPTO_SYMBOLS.includes(symbol)
      ? raw[symbol] * gate
      : raw[symbol] + (otherWeight > 0 ? freed * raw[symbol] / otherWeight : freed / (SYMBOLS.length - CRYPTO_SYMBOLS.length)),
  ]));
  return { weights, gate, raw };
}, { interval: "1d" });

addStrategySchema({
  strategyName: "multi_asset",
  interval: "1h",
  getSignal: async (symbol, when, currentPrice) => {

    const { weights, gate, raw } = await getWeights();

    const cost = DEPOSIT_USD * weights[symbol];

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
      payload: { weight: weights[symbol], ercWeight: raw[symbol], gate, weights },
      note: `${symbol} w=${weights[symbol].toFixed(3)} erc=${raw[symbol].toFixed(3)} gate=${gate.toFixed(2)} cost=$${cost.toFixed(2)}`,
    };
  },
});

declare var kill: any;

// listenDoneBacktest срабатывает на каждый символ списка: процесс завершаем после последнего
let doneCount = 0;

listenDoneBacktest(() => {
  doneCount += 1;
  if (doneCount >= SYMBOLS.length) {
    kill();
  }
});

addLauncherSchema({
  launcherName: "main_launcher",
  backtest: true,
  symbolList: SYMBOLS,
  cache: false,
})
