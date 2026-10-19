// Сводка по отчётам всех месяцев: content/<месяц>/dump/report/backtest.jsonl (или assets/backtest.jsonl,
// если отчёт переложен туда). Депозит фиксированный, P&L суммируется без реинвестирования.
// Издержки оцениваются как cost * (CC_PERCENT_FEE + CC_PERCENT_SLIPPAGE) * 2 стороны при настройках
// движка по умолчанию; pnlCost в отчёте уже нетто.
//
// Запуск из корня репо: node scripts/common/summarize_reports.mjs [--deposit 1000]
import { readFileSync, existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; };
const DEPOSIT = Number(arg("deposit", 1000));
const ROUND_TRIP_COST = 0.004; // 0.1% fee + 0.1% slippage, две стороны

const keyOf = (folder) => { const [q, year] = folder.split("_"); return `${year}-${q.toUpperCase()}`; }; // q4_2020 -> 2020-Q4
const reportOf = (folder) => ["dump/report/backtest.jsonl", "assets/backtest.jsonl"].map((p) => join(ROOT, "content", folder, p)).find(existsSync);

const folders = readdirSync(join(ROOT, "content")).filter((f) => /^q[1-4]_\d{4}$/.test(f)).sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
const months = [];
const allClosed = [];
for (const folder of folders) {
  const file = reportOf(folder);
  if (!file) { months.push({ key: keyOf(folder), folder, missing: true }); continue; }
  const rows = readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const opened = rows.filter((r) => r.data.action === "opened");
  const closed = rows.filter((r) => r.data.action === "closed");
  const net = closed.reduce((s, r) => s + r.data.pnlCost, 0);
  const fees = closed.reduce((s, r) => s + r.data.cost * ROUND_TRIP_COST, 0);
  const reasons = {};
  for (const r of closed) reasons[r.data.closeReason] = (reasons[r.data.closeReason] ?? 0) + 1;
  const gates = opened.filter((r) => r.data.payload?.gate != null && r.symbol !== "PAXGUSDT").map((r) => r.data.payload.gate);
  const paxg = closed.filter((r) => r.symbol === "PAXGUSDT").reduce((s, r) => s + r.data.pnlCost, 0);
  months.push({ key: keyOf(folder), folder, opened: opened.length, closed: closed.length, net, fees, gross: net + fees, paxg, reasons,
    gateMin: gates.length ? Math.min(...gates) : null, gateMax: gates.length ? Math.max(...gates) : null, symbols: new Set(opened.map((r) => r.symbol)).size });
  for (const r of closed) allClosed.push({ ...r.data, month: keyOf(folder) });
}

const pct = (x) => `${(x / DEPOSIT * 100).toFixed(1).padStart(6)}%`;
console.log(`deposit ${DEPOSIT}, ${folders.length} month folders, ${months.filter((m) => !m.missing).length} with reports\n`);
console.log("month    opened closed  net$     net%   fees$  gross%  PAXG$  gate      non-time closes");
for (const m of months) {
  if (m.missing) { console.log(`${m.key}  (no report)`); continue; }
  const other = Object.entries(m.reasons).filter(([k]) => k !== "time_expired").map(([k, v]) => `${k}:${v}`).join(" ");
  const incomplete = m.opened !== m.closed ? ` OPEN!=CLOSED` : "";
  console.log(`${m.key}  ${String(m.opened).padStart(5)} ${String(m.closed).padStart(6)}  ${m.net.toFixed(0).padStart(6)} ${pct(m.net)}  ${m.fees.toFixed(0).padStart(5)} ${pct(m.gross)}  ${m.paxg.toFixed(0).padStart(5)}  ${m.gateMin == null ? "  -  " : `${m.gateMin.toFixed(2)}..${m.gateMax.toFixed(2)}`}  ${other}${incomplete}`);
}

const years = {};
for (const m of months) { if (m.missing) continue; const y = m.key.slice(0, 4); years[y] ??= { net: 0, fees: 0, closed: 0, n: 0 }; years[y].net += m.net; years[y].fees += m.fees; years[y].closed += m.closed; years[y].n++; }
console.log("\nyear   months trades    net$    net%   fees$  gross%");
let totNet = 0, totFees = 0, totN = 0;
for (const [y, v] of Object.entries(years)) { totNet += v.net; totFees += v.fees; totN += v.n; console.log(`${y}   ${String(v.n).padStart(4)}  ${String(v.closed).padStart(5)}  ${v.net.toFixed(0).padStart(6)} ${pct(v.net)}  ${v.fees.toFixed(0).padStart(5)} ${pct(v.net + v.fees)}`); }
const yearsSpan = totN / 12;
console.log(`TOTAL  ${String(totN).padStart(4)}  ${String(allClosed.length).padStart(5)}  ${totNet.toFixed(0).padStart(6)} ${pct(totNet)}  ${totFees.toFixed(0).padStart(5)} ${pct(totNet + totFees)}   (${yearsSpan.toFixed(1)} years: net ${(totNet / DEPOSIT / yearsSpan * 100).toFixed(1)}%/y simple, gross ${((totNet + totFees) / DEPOSIT / yearsSpan * 100).toFixed(1)}%/y)`);

// кумулятивный P&L по времени закрытия, просадка от пика в долларах
allClosed.sort((a, b) => a.closeTime - b.closeTime);
let eq = DEPOSIT, peak = DEPOSIT, mdd = 0, mddAt = null;
for (const r of allClosed) { eq += r.pnlCost; peak = Math.max(peak, eq); if (eq - peak < mdd) { mdd = eq - peak; mddAt = new Date(r.closeTime).toISOString().slice(0, 10); } }
console.log(`\ncumulative P&L: final ${eq.toFixed(0)}, peak ${peak.toFixed(0)}, max drawdown ${mdd.toFixed(0)}$ (${(mdd / peak * 100).toFixed(0)}% of peak) at ${mddAt}`);
const nonTime = allClosed.filter((r) => r.closeReason !== "time_expired");
if (nonTime.length) {
  console.log(`\n${nonTime.length} closes not by time (check the data behind them):`);
  for (const r of nonTime.slice(0, 30)) console.log(`  ${r.month} ${r.symbol.padEnd(12)} ${r.closeReason.padEnd(12)} pnl ${r.pnl.toFixed(1).padStart(6)}%  open ${r.priceOpen} close ${r.pnlPriceClose}`);
  if (nonTime.length > 30) console.log(`  ... ${nonTime.length - 30} more`);
}
