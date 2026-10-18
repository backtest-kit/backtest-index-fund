// Помесячные списки тикеров индексного фонда: для каждого месяца топ-N USDT-пар спота Binance
// по обороту за ПРЕДЫДУЩИЙ месяц. Список известен до начала месяца - заглядывания вперёд нет.
// Пишет ./scripts/common/universe.json; из него generate_months.mjs штампует папки content/<месяц>.
//
// Запуск из корня репо: node scripts/common/build_universe.mjs [--top 20] [--from 2020-09] [--to 2026-09]
//
// Месячные свечи всех пар (~700 запросов) кэшируются в ./tmp/binance_monthly_usdt.json (tmp в .gitignore);
// --refresh качает их заново.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ccxt from "ccxt";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RAW_FILE = join(ROOT, "tmp", "binance_monthly_usdt.json");
const OUT_FILE = join(ROOT, "scripts", "common", "universe.json");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const TOP = Number(arg("top", 20));
const FROM = arg("from", "2020-09");
const TO = arg("to", "2026-09");
const MIN_LISTING_DAYS = 90;
const REFRESH = process.argv.includes("--refresh");

// Стейблкоины и фиат в базе, плечевые токены, обёртки и стейкинг-деривативы BTC/ETH/SOL, золото (парковка)
const STABLE_OR_FIAT = /^(USDT|USDC|BUSD|TUSD|FDUSD|DAI|USDP|UST|USTC|EUR|GBP|AUD|TRY|BRL|RUB|UAH|BIDR|NGN|ZAR|PLN|RON|ARS|MXN|COP|IDR|KZT|AED|USD|JPY|USD1|XUSD|USDE|USDS|FRAX|LUSD|GUSD|USDD|PYUSD|EURI|AEUR|SUSD|BKRW|VAI|BVND|PAX|USDSB|USDQ|RLUSD|USDY|BFUSD)$/;
const LEVERAGED = /(UP|DOWN|BULL|BEAR)$/;
const WRAPPED_OR_PARKING = /^(WBTC|WBETH|BETH|STETH|WSTETH|CBETH|RETH|BNSOL|BBSOL|JITOSOL|MSOL|PAXG|XAUT|BTCST|BTCB|RENBTC|TBTC|SBTC|WETH|ETHW|BNBX)$/;

const DAY = 86_400_000;
const ym = (t) => new Date(t).toISOString().slice(0, 7);
const prevMonth = (m) => {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
};

const fetchRaw = async () => {
  const exchange = new ccxt.binance({ enableRateLimit: true });
  const markets = await exchange.loadMarkets();
  const symbols = Object.values(markets)
    .filter((m) => m.spot && m.quote === "USDT")
    .map((m) => m.symbol);
  console.log(`USDT spot pairs on Binance (incl. delisted): ${symbols.length}, fetching monthly candles...`);
  const raw = {};
  let done = 0;
  for (const symbol of symbols) {
    try {
      const rows = await exchange.fetchOHLCV(symbol, "1M", Date.parse("2019-01-01T00:00:00Z"), 120);
      raw[symbol] = rows.map(([t, , , , close, volume]) => [t, close, volume * close]);
    } catch {
      raw[symbol] = null;
    }
    if (++done % 50 === 0) process.stdout.write(`${done} `);
  }
  console.log();
  mkdirSync(dirname(RAW_FILE), { recursive: true });
  writeFileSync(RAW_FILE, JSON.stringify(raw));
  return raw;
};

const raw = !REFRESH && existsSync(RAW_FILE)
  ? JSON.parse(readFileSync(RAW_FILE, "utf8"))
  : await fetchRaw();

// quoteVolume по месяцам и дата первой месячной свечи (приближение даты листинга)
const volumeByMonth = {};
const firstSeen = {};
for (const [symbol, rows] of Object.entries(raw)) {
  if (!rows || !rows.length) continue;
  const base = symbol.split("/")[0];
  if (!/^[A-Z0-9]+$/.test(base)) continue; // тикеры с не-ASCII именами ccxt не резолвит
  if (STABLE_OR_FIAT.test(base) || LEVERAGED.test(base) || WRAPPED_OR_PARKING.test(base)) continue;
  firstSeen[symbol] = rows[0][0];
  for (const [t, , quoteVolume] of rows) {
    (volumeByMonth[ym(t)] ??= {})[symbol] = quoteVolume;
  }
}

const months = {};
for (const month of Object.keys(volumeByMonth).sort()) {
  if (month < FROM || month > TO) continue;
  const rankedBy = prevMonth(month);
  const monthStart = Date.parse(`${month}-01T00:00:00Z`);
  const ranked = Object.entries(volumeByMonth[rankedBy] ?? {})
    .filter(([symbol]) => monthStart - firstSeen[symbol] >= MIN_LISTING_DAYS * DAY)
    .sort((a, b) => b[1] - a[1]);
  if (ranked.length < TOP) {
    console.warn(`${month}: only ${ranked.length} candidates, skipped`);
    continue;
  }
  months[month] = {
    rankedBy,
    basket: ranked.slice(0, TOP).map(([symbol]) => symbol.replace("/", "")),
    volumeUsdTop1: Math.round(ranked[0][1]),
    volumeUsdCutoff: Math.round(ranked[TOP - 1][1]),
  };
}

writeFileSync(OUT_FILE, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "Binance spot, quoteVolume of previous calendar month, 1M candles via ccxt",
  params: { top: TOP, minListingDays: MIN_LISTING_DAYS, from: FROM, to: TO },
  months,
}, null, 2) + "\n");

for (const [month, { rankedBy, basket }] of Object.entries(months)) {
  console.log(`${month} (by ${rankedBy}): ${basket.join(" ")}`);
}
console.log(`\n${Object.keys(months).length} months -> ${OUT_FILE}`);
