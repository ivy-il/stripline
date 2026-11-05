/**
 * Packs the standalone build into a single archive for Node hosting on a shared account
 * (DirectAdmin / cPanel "Setup Node.js App", Phusion Passenger). Run from `site/` after `npm run build`:
 *
 *   node tools/pack-hosting.mjs            → dist-hosting/stripline-app.tar.gz
 *
 * - copies .next/standalone + public + .next/static into one folder (server.js serves them itself)
 * - swaps the sharp binaries of the build machine (e.g. Windows) for Linux x64 glibc ones,
 *   so next/image optimisation works on the server
 * - copies .env.production if it exists (variables set in the panel take precedence)
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const site = process.cwd();
const standalone = join(site, ".next", "standalone");
if (!existsSync(join(standalone, "server.js"))) {
  console.error('No .next/standalone/server.js – run "npm run build" first (next.config.ts needs output: "standalone").');
  process.exit(1);
}

const outDir = join(site, "dist-hosting");
const app = join(outDir, "stripline-app");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

console.log("Copying standalone server, public/ and .next/static …");
cpSync(standalone, app, { recursive: true });
cpSync(join(site, "public"), join(app, "public"), { recursive: true });
cpSync(join(site, ".next", "static"), join(app, ".next", "static"), { recursive: true });
if (existsSync(join(site, ".env.production"))) cpSync(join(site, ".env.production"), join(app, ".env.production"));

const imgDir = join(app, "node_modules", "@img");
const sharpPkg = join(app, "node_modules", "sharp", "package.json");
if (existsSync(sharpPkg)) {
  const { version, optionalDependencies: opt = {} } = JSON.parse(readFileSync(sharpPkg, "utf8"));
  const wanted = { "sharp-linux-x64": version, "sharp-libvips-linux-x64": opt["@img/sharp-libvips-linux-x64"] };
  console.log(`Fetching Linux sharp binaries (${Object.entries(wanted).map(([n, v]) => `${n}@${v}`).join(", ")}) …`);
  for (const name of readdirSync(imgDir)) {
    if (/^sharp-(win32|darwin|wasm32)/.test(name)) rmSync(join(imgDir, name), { recursive: true, force: true });
  }
  // `npm pack` + tar instead of `npm install --os=linux`: npm rejects the glibc package on a non-Linux machine.
  // Relative paths only, so GNU tar (Git Bash) does not read "C:" as a remote host.
  const tmp = mkdtempSync(join(tmpdir(), "stripline-sharp-"));
  for (const [name, ver] of Object.entries(wanted)) {
    const tgz = execSync(`npm pack @img/${name}@${ver} --silent`, { cwd: tmp, encoding: "utf8" }).trim().split("\n").pop();
    execSync(`tar -xzf ${tgz}`, { cwd: tmp });
    cpSync(join(tmp, "package"), join(imgDir, name), { recursive: true });
    rmSync(join(tmp, "package"), { recursive: true, force: true });
  }
  rmSync(tmp, { recursive: true, force: true });
}

console.log("Creating dist-hosting/stripline-app.tar.gz …");
execSync(`tar -czf stripline-app.tar.gz -C stripline-app .`, { cwd: outDir, stdio: "inherit" });
console.log(`Done: ${join(outDir, "stripline-app.tar.gz")}`);
