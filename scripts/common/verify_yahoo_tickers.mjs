// Сверка карты тикеров Yahoo с ценами Binance: для каждого месяца, где монета стоит в корзине,
// сравниваются закрытия на входе в месяц и на его конце. Ловит подмену монеты одноимённым токеном,
// деноминации (NPXS 1000:1 в 2021), куски чужой истории (OP-USD до октября 2022) и цены ниже
// разрешения Yahoo. Расхождение в большинстве месяцев - монета помечается null в yahoo_tickers.json
// (с причиной в yahoo_tickers_rejected.json); единичные плохие месяцы пишутся в badMonths, и
// build_universe.mjs не берёт монету в эти месяцы. После сверки universe.json пересобрать и месяцы перегенерировать.
//
// Запуск из корня репо: node scripts/common/verify_yahoo_tickers.mjs
// Месячные закрытия Binance берутся из ./tmp/binance_monthly_usdt.json (их кладёт build_universe.mjs).
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TICKERS = join(ROOT, "scripts", "common", "yahoo_tickers.json");
const REJECTED = join(ROOT, "scripts", "common", "yahoo_tickers_rejected.json");
const UNIVERSE = join(ROOT, "scripts", "common", "universe.json");
const RAW = join(ROOT, "tmp", "binance_monthly_usdt.json");
const MAX_DEVIATION = 0.15; // 15%: агрегат Yahoo против спота Binance в норме расходится на проценты
const MIN_PRICE = 1e-5;     // ниже этого 7 знаков Yahoo дают шаг цены больше процента (PEPE по 8e-7: шаг 12%)
const prevMonth = (month) => {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};
const PAUSE_MS = 1500;
const UA = "Mozilla/5.0";
const DAY_MS = 86_400_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const yahooDaily = async (ticker) => {
  let wait = 5000;
  for (let attempt = 0; attempt < 6; attempt++) {
    const host = attempt % 2 ? "query1" : "query2";
    const response = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=15y&interval=1d&events=none`, { headers: { "User-Agent": UA } });
    if (response.status === 429) { await sleep(wait); wait = Math.min(wait * 2, 60_000); continue; }
    if (!response.ok) return null;
    const result = (await response.json()).chart?.result?.[0];
    if (!result?.timestamp) return null;
    const closes = new Map();
    result.timestamp.forEach((t, i) => {
      const close = result.indicators.quote[0].close[i];
      if (close != null && close > 0) closes.set(Math.floor((t * 1000 + 12 * 3600_000) / DAY_MS) * DAY_MS, close);
    });
    return closes;
  }
  throw new Error(`rate limited: ${ticker}`);
};

const tickers = JSON.parse(readFileSync(TICKERS, "utf8"));
const universe = JSON.parse(readFileSync(UNIVERSE, "utf8"));
const raw = JSON.parse(readFileSync(RAW, "utf8"));
// Binance: закрытие месяца по месячной свече (timestamp - начало месяца)
const binanceMonthClose = (symbol, month) => {
  const rows = raw[symbol.replace(/USDT$/, "/USDT")] ?? [];
  const start = Date.parse(`${month}-01T00:00:00Z`);
  const row = rows.find(([t]) => t === start);
  return row ? row[1] : null;
};
const monthEnd = (month) => {
  const [y, m] = month.split("-").map(Number);
  return Date.UTC(y, m, 0); // последний день месяца, полночь UTC
};
const monthsOf = (symbol) => Object.entries(universe.months).filter(([, v]) => v.basket.includes(symbol)).map(([m]) => m);

const rejected = {};
let checked = 0;
for (const [symbol, entry] of Object.entries(tickers)) {
  if (!entry) continue;
  const months = symbol === "PAXGUSDT" ? Object.keys(universe.months) : monthsOf(symbol);
  if (!months.length) continue;
  const closes = await yahooDaily(entry.ticker);
  await sleep(PAUSE_MS);
  checked++;
  if (!closes) { rejected[symbol] = { ticker: entry.ticker, reason: "no yahoo series" }; console.log(`${symbol.padEnd(14)} ${entry.ticker.padEnd(16)} REJECT: no series`); continue; }
  // Месяц корзины проверяется с двух концов: закрытие предыдущего месяца (вход в месяц) и закрытие
  // самого месяца. Подменённый кусок истории, как у OP-USD до октября 2022, виден на входе.
  const yahooAt = (day) => { for (let k = 0; k < 4; k++) { const v = closes.get(day - k * DAY_MS); if (v != null) return v; } return null; };
  const deviations = [];
  for (const month of months) {
    const checks = [
      { edge: "start", binance: binanceMonthClose(symbol, prevMonth(month)), yahoo: yahooAt(monthEnd(prevMonth(month))) },
      { edge: "end", binance: binanceMonthClose(symbol, month), yahoo: yahooAt(monthEnd(month)) },
    ].filter((c) => c.binance && c.yahoo);
    if (!checks.length) continue;
    const worstEdge = checks.map((c) => ({ ...c, dev: Math.abs(Math.log(c.yahoo / c.binance)) })).sort((a, b) => b.dev - a.dev)[0];
    // Yahoo хранит цены с 7 знаками: дешевле MIN_PRICE доходности квантованы шагом в проценты
    const tooCheap = checks.some((c) => c.binance < MIN_PRICE);
    deviations.push({ month, ...worstEdge, bad: worstEdge.dev > MAX_DEVIATION || tooCheap, tooCheap });
  }
  if (!deviations.length) { console.log(`${symbol.padEnd(14)} ${entry.ticker.padEnd(16)} no overlapping months to compare`); continue; }
  const bad = deviations.filter((d) => d.bad);
  const worst = [...deviations].sort((a, b) => b.dev - a.dev)[0];
  // Подмена монеты расходится с Binance в большинстве месяцев - тикер целиком в null.
  // Единичные плохие месяцы (кусок чужой истории, битый край, слишком дешёвая цена) исключаются помесячно.
  if (bad.length * 2 > deviations.length) {
    rejected[symbol] = { ticker: entry.ticker, reason: `price mismatch in ${bad.length}/${deviations.length} months, worst ${worst.month} ${worst.edge}: yahoo ${worst.yahoo} vs binance ${worst.binance}` };
    console.log(`${symbol.padEnd(14)} ${entry.ticker.padEnd(16)} REJECT: ${rejected[symbol].reason}`);
  } else {
    entry.badMonths = bad.map((d) => d.month);
    if (!entry.badMonths.length) delete entry.badMonths;
    console.log(`${symbol.padEnd(14)} ${entry.ticker.padEnd(16)} ok, worst ${(worst.dev * 100).toFixed(1)}% in ${worst.month} ${worst.edge} (${deviations.length} months${bad.length ? `, excluded: ${bad.map((d) => d.month + (d.tooCheap ? "(cheap)" : "")).join(" ")}` : ""})`);
  }
}

for (const symbol of Object.keys(rejected)) tickers[symbol] = null;
writeFileSync(TICKERS, JSON.stringify(Object.fromEntries(Object.entries(tickers).sort()), null, 1) + "\n");
writeFileSync(REJECTED, JSON.stringify(rejected, null, 1) + "\n");
console.log(`\nchecked ${checked}, rejected ${Object.keys(rejected).length}: ${Object.keys(rejected).join(" ") || "-"}\n-> ${TICKERS}, reasons in ${REJECTED}`);
if (Object.keys(rejected).length) console.log("next: node scripts/common/build_universe.mjs ... && node scripts/common/resolve_yahoo_tickers.mjs (repeat until clean) && node scripts/common/generate_months.mjs");
