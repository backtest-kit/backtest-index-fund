// Штампует папки content/q<n>_<yyyy>/ копипастой из эталонного квартала: код стратегии и биржи
// копируется как есть, подставляются только список тикеров (блок BASKET:BEGIN..BASKET:END в
// main.strategy.ts) и фрейм квартала (в modules/backtest.module.ts). Общего кода между папками нет.
// Папка это календарный квартал (q1 = январь-март), корзина берётся по обороту месяца перед началом
// квартала. Кварталы, не закончившиеся к сегодняшнему дню, не штампуются.
// Заодно переписывает scripts/linux/run_strategy.sh и scripts/win/run_strategy.bat.
//
// Запуск из корня репо: node scripts/common/generate_months.mjs [--source content/q4_2020]
// Источник списков: scripts/common/universe.json (см. build_universe.mjs).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const SOURCE = join(ROOT, arg("source", "content/q4_2020"));
const universe = JSON.parse(readFileSync(join(ROOT, "scripts/common/universe.json"), "utf8"));

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const MONTHS_RU_GEN = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

const strategySource = readFileSync(join(SOURCE, "main.strategy.ts"), "utf8");
const moduleSource = readFileSync(join(SOURCE, "modules/backtest.module.ts"), "utf8");
if (!/\/\/ BASKET:BEGIN[\s\S]*\/\/ BASKET:END/.test(strategySource)) {
  throw new Error(`${SOURCE}/main.strategy.ts: нет блока // BASKET:BEGIN .. // BASKET:END`);
}
if (!/const TICKER_OVERRIDES: Record<string, string> = \{[\s\S]*?\};/.test(moduleSource)) {
  throw new Error(`${SOURCE}/modules/backtest.module.ts: нет блока const TICKER_OVERRIDES`);
}

// Тикеры Yahoo, отличные от BASE-USD (см. resolve_yahoo_tickers.mjs); в модуль месяца
// попадают только исключения для монет его корзины
const tickersPath = join(ROOT, "scripts/common/yahoo_tickers.json");
const yahooTickers = existsSync(tickersPath) ? JSON.parse(readFileSync(tickersPath, "utf8")) : {};
const overridesFor = (basket) => {
  const lines = [...basket, "PAXGUSDT"]
    .filter((symbol) => yahooTickers[symbol]?.ticker && yahooTickers[symbol].ticker !== symbol.replace(/USDT$/, "-USD"))
    .map((symbol) => `  ${symbol}: "${yahooTickers[symbol].ticker}",`);
  const missing = basket.filter((symbol) => yahooTickers[symbol] === null);
  const unchecked = basket.filter((symbol) => !(symbol in yahooTickers));
  if (missing.length || unchecked.length) {
    throw new Error(
      `корзина содержит монеты без тикера Yahoo (${missing.join(", ") || "-"}) или непроверенные (${unchecked.join(", ") || "-"}): `
      + "прогоните resolve_yahoo_tickers.mjs и build_universe.mjs до пустого списка непроверенных",
    );
  }
  return `const TICKER_OVERRIDES: Record<string, string> = {\n${lines.join("\n")}${lines.length ? "\n" : ""}};`;
};

const folderOf = (month) => {
  const [y, m] = month.split("-").map(Number);
  return `q${Math.ceil(m / QUARTER_MONTHS)}_${y}`;
};
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m: 1..12

const QUARTER_MONTHS = 3;
const addMonths = (y, m, n) => [y + Math.floor((m - 1 + n) / 12), ((m - 1 + n) % 12) + 1]; // m: 1..12

const generated = [];
const quarterStarts = Object.entries(universe.months).filter(([month]) => (Number(month.split("-")[1]) - 1) % QUARTER_MONTHS === 0);
for (const [month, { rankedBy, basket }] of quarterStarts) {
  const [y, m] = month.split("-").map(Number);
  const [ey, em] = addMonths(y, m, QUARTER_MONTHS - 1);
  if (Date.UTC(ey, em, 0, 23, 59, 59) > Date.now()) {
    console.log(`skip ${month}: quarter ends after today`);
    continue;
  }
  const [py, pm] = rankedBy.split("-").map(Number);
  const folder = folderOf(month);
  const dir = join(ROOT, "content", folder);
  mkdirSync(join(dir, "modules"), { recursive: true });

  const basketBlock = [
    "// BASKET:BEGIN",
    `// ${folder.toUpperCase().replace("_", " ")} (${MONTHS_RU_GEN[m - 1]} - ${MONTHS_RU_GEN[em - 1]}): топ-${basket.length} USDT-пар спота Binance по обороту за ${MONTHS_RU_GEN[pm - 1]} ${py} (известен до начала квартала),`,
    "// листинг не моложе 90 дней, без стейблкоинов, плечевых токенов и обёрток BTC/ETH.",
    "// Сгенерировано scripts/common/generate_months.mjs из scripts/common/universe.json.",
    "const BASKET = [",
    ...basket.map((symbol) => `  "${symbol}",`),
    "];",
    "// BASKET:END",
  ].join("\n");
  const strategy = strategySource.replace(/\/\/ BASKET:BEGIN[\s\S]*\/\/ BASKET:END/, basketBlock);

  const mm = String(m).padStart(2, "0");
  const module = moduleSource
    .replace(/const TICKER_OVERRIDES: Record<string, string> = \{[\s\S]*?\};/, overridesFor(basket))
    .replace(/frameName: "[^"]*"/, `frameName: "${folder}_frame"`)
    .replace(/startDate: new Date\("[^"]*"\)/, `startDate: new Date("${y}-${mm}-01T00:00:00Z")`)
    .replace(/endDate: new Date\("[^"]*"\)/, `endDate: new Date("${ey}-${String(em).padStart(2, "0")}-${String(lastDay(ey, em)).padStart(2, "0")}T23:59:59Z")`)
    .replace(/note: "[^"]*"/, `note: "${folder.toUpperCase().replace("_", " ")}: ${MONTHS_EN[m - 1]} - ${MONTHS_EN[em - 1]}"`);

  writeFileSync(join(dir, "main.strategy.ts"), strategy);
  writeFileSync(join(dir, "modules/backtest.module.ts"), module);
  // classes/ копируются как есть: источники свечей и прочие утилиты папки месяца
  if (existsSync(join(SOURCE, "classes"))) {
    mkdirSync(join(dir, "classes"), { recursive: true });
    for (const file of readdirSync(join(SOURCE, "classes"))) {
      copyFileSync(join(SOURCE, "classes", file), join(dir, "classes", file));
    }
  }
  generated.push(folder);
}

// Раннеры всех месяцев по образцу прежних generate_test.sh / .bat: явный список, один процесс на месяц
const cli = "./node_modules/@backtest-kit/cli/build/index.mjs";
mkdirSync(join(ROOT, "scripts/linux"), { recursive: true });
mkdirSync(join(ROOT, "scripts/win"), { recursive: true });
// Код выхода месяца не проверяется: стратегия завершает процесс через kill() (SIGKILL, код 137),
// это штатный финал, а не ошибка. Упавший месяц виден по отсутствию closed в его отчёте
// (node scripts/common/summarize_reports.mjs).
writeFileSync(join(ROOT, "scripts/linux/run_strategy.sh"), [
  "#!/bin/bash",
  "# Прогон индексного фонда по всем кварталам, один процесс CLI на квартал. Нужны поднятые docker/mongo и docker/redis.",
  "# Отчёты: content/<квартал>/dump/report/backtest.jsonl. Запуск из корня репо: bash scripts/linux/run_strategy.sh",
  "# Каждый квартал завершается kill() со статусом 137 - это штатно, прогон продолжается; сводка: node scripts/common/summarize_reports.mjs",
  ...generated.map((folder) => `node ${cli} --backtest --entry ./content/${folder}/main.strategy.ts`),
  "",
].join("\n"));
writeFileSync(join(ROOT, "scripts/win/run_strategy.bat"), [
  "@echo off",
  "REM Прогон индексного фонда по всем кварталам, один процесс CLI на квартал. Нужны поднятые docker\\mongo и docker\\redis.",
  "REM Отчёты: content\\<квартал>\\dump\\report\\backtest.jsonl. Запуск из корня репо: scripts\\win\\run_strategy.bat",
  "REM Каждый квартал завершается kill() с ненулевым кодом - это штатно, прогон продолжается; сводка: node scripts\\common\\summarize_reports.mjs",
  ...generated.map((folder) => `node ${cli.replace(/\//g, "\\")} --backtest --entry .\\content\\${folder}\\main.strategy.ts`),
  "",
].join("\r\n"));

console.log(`generated ${generated.length} quarters: ${generated[0]} .. ${generated[generated.length - 1]}`);
if (!existsSync(join(SOURCE, "main.strategy.ts"))) process.exit(1);
