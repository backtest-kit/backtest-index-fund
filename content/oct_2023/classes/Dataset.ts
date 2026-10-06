import { singleshot } from "functools-kit";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const SIGNALS_PATH = "./assets/signals.jsonl";

interface TradingSignal {
  messageId: number;
  symbol: string;
  entry: {
    entryRange: {
      from: number;
      to: number;
    };
    id: number;
    position: "long" | "short";
    reasoning: string;
    stoploss: number;
    symbol: string;
    targets: number[];
    _context: {
      model: string;
    };
  };
  url: string;
  message: {
    id: number;
    content: string;
    channel: string;
    date: string;
  };
}

type DateKey = `${"dd"}.${"mm"}.${"yyyy"}`;

const toDateKey = (date: Date): DateKey => {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getUTCFullYear());
  return `${dd}.${mm}.${yyyy}` as DateKey;
};

export class DatasetUtils {

    private _valueMap = new Map<DateKey, TradingSignal[]>();

    private waitForInit = singleshot(async () => {
        const rl = createInterface({
            input: createReadStream(SIGNALS_PATH),
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            if (!line.trim()) {
                continue;
            }
            const signal: TradingSignal = JSON.parse(line);
            const key = toDateKey(new Date(signal.message.date));
            const signals = this._valueMap.get(key);
            if (signals) {
                signals.push(signal);
            } else {
                this._valueMap.set(key, [signal]);
            }
        }
    })

    public getSignal = async (symbol: string, when: Date): Promise<TradingSignal | null> => {
        await this.waitForInit();
        const signals = this._valueMap.get(toDateKey(when));
        if (!signals) {
            return null;
        }
        // Без look ahead bias: берем только сигналы, опубликованные не позже when
        const published = signals.filter(
            (signal) =>
                signal.symbol === symbol &&
                new Date(signal.message.date).getTime() <= when.getTime(),
        );
        if (!published.length) {
            return null;
        }
        // Последний по времени публикации
        return published.reduce((a, b) =>
            new Date(a.message.date).getTime() >= new Date(b.message.date).getTime() ? a : b,
        );
    };
}

export const Dataset = new DatasetUtils();
