import { memoize } from "functools-kit";

/** Сырая свеча в формате ccxt: [timestamp, open, high, low, close, volume] */
type TRawCandle = (number | undefined)[];

/** Публичный REST фьючерсов Binance USDⓈ-M, без ключа. Klines отдаёт максимум 1500 свечей за запрос */
const KLINES_ENDPOINT = "https://fapi.binance.com/fapi/v1/klines";
const EXCHANGE_INFO_ENDPOINT = "https://fapi.binance.com/fapi/v1/exchangeInfo";
const PAGE_LIMIT = 1500;
/** Раньше этой даты бессрочных контрактов USDⓈ-M на Binance не было */
const HISTORY_START = Date.parse("2019-09-01T00:00:00Z");
const RETRY_BASE_MS = 3_000;
const MAX_ATTEMPTS = 6;

const INTERVAL_MS: Record<string, number> = {
  "1m": 60_000, "3m": 180_000, "5m": 300_000, "15m": 900_000, "30m": 1_800_000,
  "1h": 3_600_000, "2h": 7_200_000, "4h": 14_400_000, "6h": 21_600_000, "8h": 28_800_000, "12h": 43_200_000,
  "1d": 86_400_000,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Свечи бессрочных контрактов Binance USDⓈ-M без ccxt.
 *
 * getCandles совместим с фетчером getCandlesFilled / getCandlesSampled из backtest-kit:
 * (symbol, interval, since, limit) => сырые массивы. Символ - тикер контракта, совпадает со
 * спотовым: "BTCUSDT". Дневная история символа качается один раз на процесс и режется в памяти;
 * интервалы короче дня качаются постранично под конкретный запрос, страницы кэшируются.
 *
 * Заглядывания вперёд нет по построению: ядро запрашивает свечи с since и limit, обрезанными
 * по текущему времени движка, класс отдаёт ровно запрошенный диапазон.
 */
export class BinanceFuturesUtils {

  private fetchPage = async (symbol: string, interval: string, startTime: number, endTime: number): Promise<TRawCandle[]> => {
    let wait = RETRY_BASE_MS;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const url = `${KLINES_ENDPOINT}?symbol=${encodeURIComponent(symbol)}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=${PAGE_LIMIT}`;
      const response = await fetch(url);
      if (response.status === 429 || response.status === 418) {
        console.warn(`BinanceFutures ${symbol} ${interval}: rate limited (${response.status}), retry in ${wait / 1000}s`);
        await sleep(wait);
        wait *= 2;
        continue;
      }
      if (!response.ok) {
        throw new Error(`BinanceFutures ${symbol} ${interval}: HTTP ${response.status}`);
      }
      const rows = (await response.json()) as Array<(string | number)[]>;
      return rows.map(([openTime, open, high, low, close, volume]) => [
        Number(openTime), Number(open), Number(high), Number(low), Number(close), Number(volume),
      ]);
    }
    throw new Error(`BinanceFutures ${symbol} ${interval}: no response after ${MAX_ATTEMPTS} attempts`);
  };

  /** Полный диапазон [startTime, endTime) постранично */
  private fetchRange = async (symbol: string, interval: string, startTime: number, endTime: number): Promise<TRawCandle[]> => {
    const step = INTERVAL_MS[interval];
    const out: TRawCandle[] = [];
    let from = startTime;
    while (from < endTime) {
      const page = await this.fetchPage(symbol, interval, from, endTime - 1);
      if (!page.length) {
        break;
      }
      out.push(...page);
      if (page.length < PAGE_LIMIT) {
        break;
      }
      from = page[page.length - 1][0]! + step;
    }
    return out;
  };

  /** Вся дневная история символа, один раз на процесс */
  private fetchDaily = memoize(
    ([symbol]) => symbol,
    async (symbol: string): Promise<TRawCandle[]> => {
      const candles = await this.fetchRange(symbol, "1d", HISTORY_START, Date.now());
      if (candles.length) {
        console.log(`BinanceFutures ${symbol}: ${candles.length} daily bars ${new Date(candles[0][0]!).toISOString().slice(0, 10)} .. ${new Date(candles[candles.length - 1][0]!).toISOString().slice(0, 10)}`);
      } else {
        console.warn(`BinanceFutures ${symbol}: no daily bars (no USDⓈ-M perpetual?)`);
      }
      return candles;
    },
  );

  /** Страницы интервалов короче дня, кэш по символу, интервалу и началу запрошенного окна */
  private fetchIntraday = memoize(
    ([symbol, interval, since, limit]) => `${symbol}:${interval}:${since}:${limit}`,
    async (symbol: string, interval: string, since: number, limit: number): Promise<TRawCandle[]> =>
      this.fetchRange(symbol, interval, since, since + limit * INTERVAL_MS[interval]),
  );

  public getCandles = async (symbol: string, interval: string, since: number, limit: number): Promise<TRawCandle[]> => {
    const step = INTERVAL_MS[interval];
    if (!step) {
      throw new Error(`BinanceFutures: unsupported interval ${interval}, expected one of ${Object.keys(INTERVAL_MS).join(", ")}`);
    }
    const start = Math.floor(since / step) * step;
    if (interval === "1d") {
      const all = await this.fetchDaily(symbol);
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
    }
    return this.fetchIntraday(symbol, interval, start, limit);
  };

  /** Дата листинга бессрочных контрактов по exchangeInfo: ms UTC, null если контракта нет */
  private fetchOnboardDates = memoize(
    () => "exchangeInfo",
    async (): Promise<Map<string, number>> => {
      const response = await fetch(EXCHANGE_INFO_ENDPOINT);
      if (!response.ok) {
        throw new Error(`BinanceFutures exchangeInfo: HTTP ${response.status}`);
      }
      const { symbols } = (await response.json()) as { symbols: Array<{ symbol: string; contractType: string; onboardDate: number }> };
      return new Map(symbols.filter((s) => s.contractType === "PERPETUAL").map((s) => [s.symbol, s.onboardDate]));
    },
  );

  public getOnboardDate = async (symbol: string): Promise<number | null> =>
    (await this.fetchOnboardDates()).get(symbol) ?? null;
}

export const BinanceFutures = new BinanceFuturesUtils();
