import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "public", "data");

/**
 * Reads a market's JSON data file directly off disk. This runs in Server
 * Components at build/request time (not in the browser), which is what
 * lets each market page render real, crawlable HTML content — a plain
 * client-side fetch() never gets indexed properly by search engines
 * because crawlers see an empty shell until JS runs.
 */
export function getMarketData(marketKey) {
  const filePath = path.join(DATA_DIR, `${marketKey}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function getMeta() {
  const filePath = path.join(DATA_DIR, "_meta.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function getAllMarketsData(marketKeys) {
  const out = {};
  for (const key of marketKeys) {
    out[key] = getMarketData(key);
  }
  return out;
}
