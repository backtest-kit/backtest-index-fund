// Скачивает всю историю канала (7 мая 2021 → 30 сентября 2026) по дням
// и пишет посты КАК ЕСТЬ в content/<mon>_<year>/assets/messages.jsonl (строка = пост).
// Запуск из корня репо (там же session.txt для telegram-reader):
//   node scripts/fetch-months-messages.mjs
import { scrapeDay } from "telegram-reader";
import { mkdirSync, createWriteStream } from "fs";
import { join } from "path";

const CHANNEL = "WallstreetQueenOfficial";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const START = Date.UTC(2021, 4, 7);   // 7 мая 2021 — первый пост канала (id=9)
const END = Date.UTC(2026, 8, 30);    // 30 сентября 2026

const pad = (n) => String(n).padStart(2, "0");

let out = null, outKey = "", total = 0;
for (let ts = START; ts <= END; ts += 86_400_000) {
  const day = new Date(ts);
  const y = day.getUTCFullYear(), m = day.getUTCMonth();
  const key = `${MONTHS[m]}_${y}`;
  if (key !== outKey) {
    if (out) out.end();
    const dir = join("content", key, "assets");
    mkdirSync(dir, { recursive: true });
    out = createWriteStream(join(dir, "messages.jsonl"));
    outKey = key;
  }
  const when = new Date(ts + 12 * 3_600_000); // полдень — внутри календарного дня
  const messages = await scrapeDay({ channel: CHANNEL, when });
  for (const msg of messages) {
    out.write(JSON.stringify(msg) + "\n");
  }
  total += messages.length;
  console.log(`[${new Date().toISOString()}] ${y}-${pad(m + 1)}-${pad(day.getUTCDate())}: +${messages.length} (всего ${total})`);
}
if (out) out.end();
console.log(`готово: ${total} постов`);
process.exit(0); // MTProto-клиент держит event loop
