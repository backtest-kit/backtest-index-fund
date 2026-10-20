import {
  addLauncherSchema,
  addStrategySchema,
  commitDividend,
  listenActivePing,
  Position,
} from "backtest-kit";

import { UzSEDividends } from "./classes/UzSEDividends";

// Параметры движка (издержки, дневной шаг, дистанции стопа и тейка) общие для всех годов и заданы в config/setup.config.ts
// Депозит в сумах делится поровну между бумагами корзины года; все суммы стратегии и отчётов в сумах
const DEPOSIT_UZS = 10_000_000;

// Уровни: стоп -50% это ограничитель просадки на годовом удержании (дневные минимумы), тейк технический
const STOP_LOSS_PERCENT = 50;
const TAKE_PROFIT_PERCENT = 2000;

// BASKET:BEGIN
// 2023: акции UzSE с медианным дневным оборотом за 2022 от 1 млн сумов, сделки не реже 90% дней,
// история от начала 2022, без дроблений внутри года; топ по обороту. Сгенерировано
// scripts/common/generate_months.mjs из scripts/common/universe.json.
const BASKET = [
  "UZMK",
  "URTS",
  "QZSM",
  "KVTS",
  "AGMKP",
];
// BASKET:END

// ISSUERS:BEGIN
// Тикер -> id эмитента в таблице дивидендов биржи (scripts/common/uzse_issuers.json)
const ISSUER_IDS: Record<string, number> = {
  UZMK: 11,
  URTS: 1,
  QZSM: 17,
  KVTS: 21,
  AGMKP: 12,
};
// ISSUERS:END

const PER_SYMBOL_UZS = DEPOSIT_UZS / BASKET.length;

// Позиция живёт до конца календарного года: вход на первом тике, выход по времени в 23:59
// 31 декабря. Срок считается от момента входа, поэтому и перезаход после стопа закрывается
// в ту же минуту; на конец фрейма ядра не полагаемся.
const yearEndOf = (when: Date): number => Date.UTC(when.getUTCFullYear() + 1, 0, 1) - 60_000;
const holdMinutesOf = (when: Date): number => Math.floor((yearEndOf(when) - when.getTime()) / 60_000);
// Короче суток до конца года не входим: круг издержек за один день не окупается
const MIN_HOLD_MINUTES = 24 * 60;

// Начисленные дивиденды: ключ позиция + финансовый год, чтобы решение не начислилось дважды
const credited = new Set<string>();

addStrategySchema({
  strategyName: "uzse_dividend_fund",
  interval: "1h",
  getSignal: async (symbol, when, currentPrice) => {

    const holdMinutes = holdMinutesOf(when);
    if (holdMinutes < MIN_HOLD_MINUTES) {
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
      cost: Math.round(PER_SYMBOL_UZS),
      minuteEstimatedTime: holdMinutes,
      payload: { weight: 1 / BASKET.length, basketSize: BASKET.length, issuerId: ISSUER_IDS[symbol] },
      note: `${symbol} cost=${PER_SYMBOL_UZS.toFixed(0)} UZS hold=${Math.round(holdMinutes / 1440)}d`,
    };
  },
});

// Дивиденд начисляется на дату решения собрания, если оно принято за время жизни позиции.
// Движок сам календаря не ведёт: когда и сколько - решает стратегия, он лишь складывает
// сумму в pnlCost позиции (строки action=dividend в dump/report/strategy.jsonl), стоп и тейк
// это не трогает. listenActivePing приходит на каждом шаге по каждой активной позиции,
// timestamp события это логическое время движка, не часы машины.
listenActivePing(async ({ symbol, data, timestamp }) => {
  const when = new Date(timestamp);
  const kind = symbol.endsWith("P") ? "preferred" : "common";
  const shares = data.cost / data.priceOpen;
  for (const dividend of await UzSEDividends.getDividends(ISSUER_IDS[symbol], kind, when)) {
    if (dividend.decisionDate < data.pendingAt) {
      continue;
    }
    const key = `${data.id}:${dividend.fiscalYear}`;
    if (credited.has(key)) {
      continue;
    }
    credited.add(key);
    const amount = Math.round(dividend.perShare * shares * 100) / 100;
    await commitDividend(symbol, {
      amount,
      note: `FY${dividend.fiscalYear}: ${dividend.perShare} UZS/share x ${shares.toFixed(2)}, decision ${new Date(dividend.decisionDate).toISOString().slice(0, 10)}`,
    });
  }
});

addLauncherSchema({
  launcherName: "main_launcher",
  backtest: true,
  symbolList: BASKET,
  cache: false,
})
