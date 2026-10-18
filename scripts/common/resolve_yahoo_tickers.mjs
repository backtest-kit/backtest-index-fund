// Соответствие символов Binance (BASEUSDT) тикерам Yahoo Finance для всех монет из universe.json.
// Для большинства тикер BASE-USD; одноимённые токены Yahoo держит под числовым суффиксом
// (UNI7083-USD, PEPE24478-USD) - такие ищутся через поиск Yahoo по тикеру и по имени проекта
// и проверяются по графику; переименованные монеты заданы явно в RENAMED.
// Пишет ./scripts/common/yahoo_tickers.json: { "UNIUSDT": "UNI7083-USD", "LENDUSDT": null, ... }
// null = на Yahoo монеты нет, build_universe.mjs такие монеты в корзины не берёт.
//
// Запуск из корня репо: node scripts/common/resolve_yahoo_tickers.mjs [--refresh | --refresh-missing]
// Без флагов уже разрешённые символы не перепроверяются; --refresh-missing перепроверяет только null.
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const UNIVERSE = join(ROOT, "scripts", "common", "universe.json");
const OUT = join(ROOT, "scripts", "common", "yahoo_tickers.json");
const REFRESH = process.argv.includes("--refresh");
const REFRESH_MISSING = process.argv.includes("--refresh-missing");
const UA = "Mozilla/5.0";
const PAUSE_MS = 1500;

/**
 * Монеты, у которых тикер Yahoo не выводится из символа Binance: переименования, ребрендинги,
 * одноимённые токены, где поиск выбирает не тот. null = сознательно исключить из корзин.
 */
const RENAMED = {
  RNDRUSDT: "RENDER-USD",     // Render Network, тикер RNDR -> RENDER в 2024
  MATICUSDT: "WMATIC-USD",    // Polygon: MATIC-USD снят после перехода на POL, Wrapped MATIC повторяет цену с марта 2021
  FTMUSDT: "WFTM-USD",        // Fantom: FTM-USD снят после ребрендинга в Sonic, Wrapped FTM повторяет цену с июня 2021
  SUSDT: "S32684-USD",        // Sonic: однобуквенный тикер поиском не находится
  COMPUSDT: "COMP5692-USD",   // Compound: по тикеру Yahoo отдаёт только акции
  PUMPUSDT: "PUMP36507-USD",  // pump.fun: одноимённый PUMP 2024 года старше, но это другой токен
  TRUMPUSDT: "TRUMP35336-USD", // Official Trump (январь 2025): одноимённый MAGA-токен 2023 года старше, но это другой токен
  LUNAUSDT: null,             // Binance LUNAUSDT до мая 2022 это Terra Classic, после - Terra 2.0: один тикер на два актива
  NEIROUSDT: null,            // несколько одноимённых мем-токенов 2024 года, какой из них листинг Binance - неочевидно
};

/** Имена проектов для поиска, когда по тикеру Yahoo отдаёт только акции */
const NAMES = {
  COMP: "Compound", GRT: "The Graph", APT: "Aptos", STX: "Stacks", SUI: "Sui", TAO: "Bittensor",
  GMT: "STEPN", MAGIC: "Treasure", SAGA: "Saga", NEIRO: "Neiro", TRUMP: "Official Trump", S: "Sonic",
  PENGU: "Pudgy Penguins", BIO: "Bio Protocol", ASTER: "Aster", PUMP: "Pump.fun", SYN: "Synapse",
  RARE: "SuperRare", LEND: "ETHLend", COCOS: "Cocos-BCX", AKRO: "Akropolis", HIFI: "Hifi Finance",
  LINA: "Linear", MASK: "Mask Network", PEPE: "Pepe",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const host = () => (Math.random() < 0.5 ? "query1" : "query2");

const getJson = async (url) => {
  let wait = 5000;
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (response.status === 429) {
      await sleep(wait);
      wait = Math.min(wait * 2, 60_000);
      continue;
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
    return response.json();
  }
  throw new Error(`rate limited: ${url}`);
};

/** Есть ли у тикера дневная история и с какой даты (ms) */
const firstBar = async (ticker) => {
  const json = await getJson(`https://${host()}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=15y&interval=1d&events=none`);
  const result = json?.chart?.result?.[0];
  if (!result?.timestamp?.length) return null;
  return result.timestamp[0] * 1000;
};

/** Криптовалюты из поиска Yahoo с тикером BASE-XXX или BASE<цифры>-XXX, приведённые к -USD */
const searchCandidates = async (base, query) => {
  const json = await getJson(`https://${host()}.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`);
  const pattern = new RegExp(`^(${base}\\d*)-[A-Z]+$`);
  const out = new Set();
  for (const quote of json?.quotes ?? []) {
    if (quote.quoteType !== "CRYPTOCURRENCY") continue;
    const match = pattern.exec(quote.symbol ?? "");
    if (match) out.add(`${match[1]}-USD`);
  }
  return [...out];
};

/** { ticker, since: "YYYY-MM-DD" } либо null, если монеты на Yahoo нет или она исключена */
const resolve = async (symbol) => {
  if (symbol in RENAMED) {
    if (RENAMED[symbol] === null) return null;
    const first = await firstBar(RENAMED[symbol]);
    return first ? { ticker: RENAMED[symbol], since: new Date(first).toISOString().slice(0, 10) } : null;
  }
  const base = symbol.replace(/USDT$/, "");
  const direct = `${base}-USD`;
  const directFirst = await firstBar(direct);
  if (directFirst) return { ticker: direct, since: new Date(directFirst).toISOString().slice(0, 10) };
  const candidates = new Set();
  for (const query of [base, direct, `${base} USD`, NAMES[base]].filter(Boolean)) {
    await sleep(PAUSE_MS);
    for (const candidate of await searchCandidates(base, query)) candidates.add(candidate);
  }
  candidates.delete(direct);
  // при нескольких одноимённых берём тикер с самой длинной историей: это оригинальный токен
  let best = null;
  for (const candidate of candidates) {
    await sleep(PAUSE_MS);
    const first = await firstBar(candidate);
    if (first && (!best || first < best.first)) best = { candidate, first };
  }
  return best ? { ticker: best.candidate, since: new Date(best.first).toISOString().slice(0, 10) } : null;
};

const universe = JSON.parse(readFileSync(UNIVERSE, "utf8"));
const symbols = [...new Set(Object.values(universe.months).flatMap((m) => m.basket))].concat(["PAXGUSDT"]).sort();
const known = !REFRESH && existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const result = { ...known };

for (const symbol of symbols) {
  const current = result[symbol];
  const stale = current !== undefined && (current === null || typeof current !== "object");
  const skip = symbol in result && !(REFRESH_MISSING && stale) && !(symbol in RENAMED);
  if (skip) continue;
  result[symbol] = await resolve(symbol);
  console.log(`${symbol.padEnd(14)} -> ${result[symbol] ? `${result[symbol].ticker} since ${result[symbol].since}` : "null (not on Yahoo)"}`);
  writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(result).sort()), null, 1) + "\n");
  await sleep(PAUSE_MS);
}

const missing = Object.entries(result).filter(([, t]) => t === null).map(([s]) => s);
console.log(`\n${symbols.length} symbols, ${missing.length} not on Yahoo: ${missing.join(" ")}\n-> ${OUT}`);
