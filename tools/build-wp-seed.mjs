// Builds the WordPress plugin seed (wordpress-plugin/stripline-headless/seed/*.json) from the
// site's own data, so a fresh WordPress import matches the site exactly (including EILAT's
// Hebrew overrides and every page text). Run after changing site/src/data or site/src/lib/eilat.ts:
//   node --experimental-strip-types tools/build-wp-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = (f) => JSON.parse(readFileSync(join(root, "site/src/data", f), "utf8"));
const { eilatOverrides } = await import(pathToFileURL(join(root, "site/src/lib/eilat.ts")).href);

const products = data("products.json").map((p) => (p.slug === "eilat" ? { ...p, ...eilatOverrides } : p));
const out = join(root, "wordpress-plugin/stripline-headless/seed");
const write = (f, v) => writeFileSync(join(out, f), JSON.stringify(v, null, 1) + "\n");

write("products.json", products);
write("families.json", data("families.json"));
write("projects.json", data("projects.json"));
write("settings.json", data("settings.json"));
console.log(`seed: ${products.length} products, ${data("families.json").length} families, ${data("projects.json").length} projects, ${Object.keys(data("settings.json")).length} settings`);
