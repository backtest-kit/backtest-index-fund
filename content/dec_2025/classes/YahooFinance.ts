import { memoize } from "functools-kit";

/** Сырая свеча в формате ccxt: [timestamp, open, high, low, close, volume] */
type TRawCandle = (number | undefined)[];

const DAY_MS = 86_400_000;

/** Весь доступный ряд качается одним запросом и дальше режется по since/limit в памяти */
const RANGE = "15y";
const RETRY_BASE_MS = 6_000;
const MAX_ATTEMPTS = 6;
const USER_AGENT = "Mozilla/5.0";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Дневные свечи Yahoo Finance chart API без ключа и без ccxt.
 *
 * getCandles совместим с фетчером getCandlesFilled / getCandlesSampled из backtest-kit:
 * (ticker, interval, since, limit) => сырые массивы. ticker - тикер Yahoo ("BTC-USD", "GC=F",
 * "^GSPC"), соответствие символов стратегии тикерам - дело модуля биржи. interval только "1d":
 * внутридневные бары Yahoo отдаёт лишь за последние 60 дней.
 *
 * Yahoo режет частые запросы (429): повтор с удвоением паузы, хосты query1/query2 чередуются.
 * Timestamp Yahoo - открытие сессии в зоне биржи, приводится к полуночи UTC этого дня;
 * null-бары выбрасываются. Сетка, дыры и битые бары (нули, выбросы) - дело getCandlesFilled
 * в ядре: аномальная свеча чинится плоской по соседям, пороги CC_GET_CANDLES_*.
 */
export class YahooFinanceUtils {

  private fetchAll = memoize(
    ([ticker]) => ticker,
    async (ticker: string): Promise<TRawCandle[]> => {
      let wait = RETRY_BASE_MS;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const host = attempt % 2 ? "query2" : "query1";
        const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${RANGE}&interval=1d&events=none`;
        const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
        if (response.status === 429) {
          console.warn(`YahooFinance ${ticker}: rate limited (429), retry in ${wait / 1000}s`);
          await sleep(wait);
          wait *= 2;
          continue;
        }
        if (!response.ok) {
          throw new Error(`YahooFinance ${ticker}: HTTP ${response.status}`);
        }
        const { chart } = await response.json();
        if (chart.error) {
          throw new Error(`YahooFinance ${ticker}: ${chart.error.description}`);
        }
        const result = chart.result[0];
        const quote = result.indicators.quote[0];
        const byDay = new Map<number, TRawCandle>();
        result.timestamp.forEach((t: number, i: number) => {
          const [open, high, low, close] = [quote.open[i], quote.high[i], quote.low[i], quote.close[i]];
          if ([open, high, low, close].some((v) => v == null)) {
            return;
          }
          const day = Math.floor((t * 1000 + 12 * 3600_000) / DAY_MS) * DAY_MS;
          byDay.set(day, [day, open, high, low, close, quote.volume[i] ?? 0]);
        });
        const candles = [...byDay.values()].sort((a, b) => a[0]! - b[0]!);
        if (!candles.length) {
          throw new Error(`YahooFinance ${ticker}: no daily bars returned`);
        }
        console.log(`YahooFinance ${ticker}: ${candles.length} daily bars ${new Date(candles[0][0]!).toISOString().slice(0, 10)} .. ${new Date(candles[candles.length - 1][0]!).toISOString().slice(0, 10)}`);
        return candles;
      }
      throw new Error(`YahooFinance ${ticker}: no response after ${MAX_ATTEMPTS} attempts`);
    },
  );

  public getCandles = async (ticker: string, interval: string, since: number, limit: number): Promise<TRawCandle[]> => {
    if (interval !== "1d") {
      throw new Error(`YahooFinance: only 1d interval is supported, got ${interval}`);
    }
    const all = await this.fetchAll(ticker);
    const start = Math.floor(since / DAY_MS) * DAY_MS;
    const out: TRawCandle[] = [];
    for (const candle of all) {
      if (candle[0]! < start) {
        continue;
      }
      out.push(candle);
      if (out.length >= limit) {
        break;
      }
    }
    return out;
  };
}

export const YahooFinance = new YahooFinanceUtils();
