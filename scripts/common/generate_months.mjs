// Штампует папки content/<mon>_<yyyy>/ копипастой из эталонного месяца: код стратегии и биржи
// копируется как есть, подставляются только список тикеров (блок BASKET:BEGIN..BASKET:END в
// main.strategy.ts) и фрейм месяца (в modules/backtest.module.ts). Общего кода между месяцами нет.
// Заодно переписывает scripts/linux/generate_strategy.sh и scripts/win/generate_strategy.bat.
//
// Запуск из корня репо: node scripts/common/generate_months.mjs [--source content/sep_2020]
// Источник списков: scripts/common/universe.json (см. build_universe.mjs).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const SOURCE = join(ROOT, arg("source", "content/sep_2020"));
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
  return `${MONTHS_EN[m - 1].slice(0, 3).toLowerCase()}_${y}`;
};
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m: 1..12

const generated = [];
for (const [month, { rankedBy, basket }] of Object.entries(universe.months)) {
  const [y, m] = month.split("-").map(Number);
  const [py, pm] = rankedBy.split("-").map(Number);
  const folder = folderOf(month);
  const dir = join(ROOT, "content", folder);
  mkdirSync(join(dir, "modules"), { recursive: true });

  const basketBlock = [
    "// BASKET:BEGIN",
    `// ${MONTHS_RU[m - 1]} ${y}: топ-${basket.length} USDT-пар спота Binance по обороту за ${MONTHS_RU_GEN[pm - 1]} ${py} (известен до начала месяца),`,
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
    .replace(/endDate: new Date\("[^"]*"\)/, `endDate: new Date("${y}-${mm}-${String(lastDay(y, m)).padStart(2, "0")}T23:59:59Z")`)
    .replace(/note: "[^"]*"/, `note: "${MONTHS_EN[m - 1]} ${y}"`);

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
writeFileSync(join(ROOT, "scripts/linux/generate_strategy.sh"), [
  "#!/bin/bash",
  "# Прогон индексного фонда по всем месяцам, один процесс CLI на месяц. Нужны поднятые docker/mongo и docker/redis.",
  "# Отчёты: content/<месяц>/dump/report/backtest.jsonl. Запуск из корня репо: bash scripts/linux/generate_strategy.sh",
  "set -e",
  ...generated.map((folder) => `node ${cli} --backtest --entry ./content/${folder}/main.strategy.ts`),
  "",
].join("\n"));
writeFileSync(join(ROOT, "scripts/win/generate_strategy.bat"), [
  "@echo off",
  "REM Прогон индексного фонда по всем месяцам, один процесс CLI на месяц. Нужны поднятые docker\\mongo и docker\\redis.",
  "REM Отчёты: content\\<месяц>\\dump\\report\\backtest.jsonl. Запуск из корня репо: scripts\\win\\generate_strategy.bat",
  ...generated.map((folder) => `node ${cli.replace(/\//g, "\\")} --backtest --entry .\\content\\${folder}\\main.strategy.ts || exit /b 1`),
  "",
].join("\r\n"));

console.log(`generated ${generated.length} months: ${generated[0]} .. ${generated[generated.length - 1]}`);
if (!existsSync(join(SOURCE, "main.strategy.ts"))) process.exit(1);
