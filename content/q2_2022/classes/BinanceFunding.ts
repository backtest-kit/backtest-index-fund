import { memoize } from "functools-kit";

/** Одно начисление фандинга бессрочного контракта USDⓈ-M */
export interface IFundingRate {
  /** Момент начисления, ms UTC; на Binance раз в 8 часов: 00:00, 08:00, 16:00 */
  fundingTime: number;
  /** Ставка за период в долях: 0.0001 = 0.01%. Положительная - лонги платят шортам */
  fundingRate: number;
  /** Mark price в момент начисления, если биржа его отдала */
  markPrice: number | null;
}

/** Публичный REST фьючерсов Binance, без ключа. Отдаёт максимум 1000 записей за запрос */
const ENDPOINT = "https://fapi.binance.com/fapi/v1/fundingRate";
const PAGE_LIMIT = 1000;
/** Раньше этой даты бессрочных контрактов USDⓈ-M на Binance не было */
const HISTORY_START = Date.parse("2019-09-01T00:00:00Z");
const RETRY_BASE_MS = 3_000;
const MAX_ATTEMPTS = 6;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * История фандинга бессрочных контрактов Binance USDⓈ-M для стратегий керри и хеджа.
 *
 * Вся история символа качается один раз на процесс и режется в памяти. Каждый публичный метод
 * принимает `when` - текущий момент виртуального времени, который движок передаёт в getSignal,
 * и возвращает только начисления с fundingTime <= when: заглядывания вперёд нет по построению.
 *
 * Символ - тикер контракта USDⓈ-M, совпадает со спотовым: "BTCUSDT".
 */
export class BinanceFundingUtils {

  private fetchAll = memoize(
    ([symbol]) => symbol,
    async (symbol: string): Promise<IFundingRate[]> => {
      const out: IFundingRate[] = [];
      let from = HISTORY_START;
      for (;;) {
        const page = await this.fetchPage(symbol, from);
        if (!page.length) {
          break;
        }
        out.push(...page);
        if (page.length < PAGE_LIMIT) {
          break;
        }
        from = page[page.length - 1].fundingTime + 1;
      }
      out.sort((a, b) => a.fundingTime - b.fundingTime);
      if (out.length) {
        console.log(`BinanceFunding ${symbol}: ${out.length} funding events ${new Date(out[0].fundingTime).toISOString().slice(0, 10)} .. ${new Date(out[out.length - 1].fundingTime).toISOString().slice(0, 10)}`);
      } else {
        console.warn(`BinanceFunding ${symbol}: no funding history (no USDⓈ-M perpetual?)`);
      }
      return out;
    },
  );

  private fetchPage = async (symbol: string, startTime: number): Promise<IFundingRate[]> => {
    let wait = RETRY_BASE_MS;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const url = `${ENDPOINT}?symbol=${encodeURIComponent(symbol)}&startTime=${startTime}&limit=${PAGE_LIMIT}`;
      const response = await fetch(url);
      if (response.status === 429 || response.status === 418) {
        console.warn(`BinanceFunding ${symbol}: rate limited (${response.status}), retry in ${wait / 1000}s`);
        await sleep(wait);
        wait *= 2;
        continue;
      }
      if (!response.ok) {
        throw new Error(`BinanceFunding ${symbol}: HTTP ${response.status}`);
      }
      const rows = (await response.json()) as Array<{ fundingTime: number; fundingRate: string; markPrice?: string }>;
      return rows.map((row) => ({
        fundingTime: row.fundingTime,
        fundingRate: Number(row.fundingRate),
        markPrice: row.markPrice ? Number(row.markPrice) : null,
      }));
    }
    throw new Error(`BinanceFunding ${symbol}: no response after ${MAX_ATTEMPTS} attempts`);
  };

  /** Последние `limit` начислений, известных на момент when (fundingTime <= when), по возрастанию времени */
  public getHistory = async (symbol: string, when: Date, limit = 21): Promise<IFundingRate[]> => {
    const all = await this.fetchAll(symbol);
    const cutoff = when.getTime();
    let end = all.length;
    while (end > 0 && all[end - 1].fundingTime > cutoff) {
      end--;
    }
    return all.slice(Math.max(0, end - limit), end);
  };

  /**
   * Средняя ставка за последние `periods` начислений на момент when, в долях за 8 часов.
   * 21 период = 7 дней. null, если истории нет: контракт ещё не торговался.
   */
  public getAverageRate = async (symbol: string, when: Date, periods = 21): Promise<number | null> => {
    const rows = await this.getHistory(symbol, when, periods);
    if (!rows.length) {
      return null;
    }
    return rows.reduce((sum, row) => sum + row.fundingRate, 0) / rows.length;
  };

  /**
   * Сумма ставок, начисленных на интервале (from, to]: фандинг, полученный шортом (или уплаченный
   * лонгом) за жизнь позиции, в долях от номинала. Для оценки закрытой позиции, to <= when.
   */
  public getAccrued = async (symbol: string, from: Date, to: Date): Promise<number> => {
    const all = await this.fetchAll(symbol);
    let sum = 0;
    for (const row of all) {
      if (row.fundingTime > from.getTime() && row.fundingTime <= to.getTime()) {
        sum += row.fundingRate;
      }
    }
    return sum;
  };
}

export const BinanceFunding = new BinanceFundingUtils();
