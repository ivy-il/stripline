/**
 * Builds the site as plain HTML for PHP-only hosting (no Node on the server). Run from `site/`:
 *
 *   npm run pack:static          → dist-static/stripline-static.tar.gz  (extract into public_html)
 *
 * - `next build` with STATIC_EXPORT=1 (see next.config.ts) → out/
 * - copies every WordPress image the pages use into out/wp-media/ (no proxy on a static host)
 * - writes contact-config.php for public/contact.php and an .htaccess (404 page, caching)
 *
 * Content is fixed at build time: after editing in WordPress, run this again and upload.
 * Reads .env.production: WP_API_URL, REVALIDATE_SECRET, CONTACT_EMAIL (mail fallback without WordPress).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";
import nextEnv from "@next/env";

const site = process.cwd();
nextEnv.loadEnvConfig(site);
const { WP_API_URL = "", REVALIDATE_SECRET = "", CONTACT_EMAIL = "" } = process.env;

// A static build freezes whatever the CMS returns, so refuse an empty or unreachable one instead of shipping
// a site without products. Rename .env.production to build from the bundled seed data on purpose.
if (WP_API_URL) {
  const count = await fetch(`${WP_API_URL.replace(/\/$/, "")}/products`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${r.statusText}`))))
    .then((list) => (Array.isArray(list) ? list.length : 0))
    .catch((err) => {
      console.error(`WordPress is not reachable at ${WP_API_URL}: ${err.message}`);
      process.exit(1);
    });
  if (!count) {
    console.error(`WordPress at ${WP_API_URL} has no products – import the catalog first (Settings → STRIPLINE).`);
    process.exit(1);
  }
  console.log(`WordPress: ${count} products.`);
}

console.log("Building static export …");
const out = join(site, "out");
rmSync(out, { recursive: true, force: true });
execSync("npx next build", { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1" } });

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else yield p;
  }
}

// The export writes segment prefetch data nested (about/__next.about/__PAGE__.txt), but the client router asks for
// the flat name (about/__next.about.__PAGE__.txt); a static host has no rewrite for it, so add the flat copies.
for (const f of [...files(out)]) {
  const rel = f.slice(out.length + 1).split(/[\\/]/);
  const i = rel.findIndex((s) => s.startsWith("__next."));
  if (i < 0 || i === rel.length - 1) continue;
  copyFileSync(f, join(out, ...rel.slice(0, i), rel.slice(i).join(".")));
}

if (WP_API_URL) {
  const uploads = `${new URL(WP_API_URL).origin}/wp-content/uploads/`;
  const paths = new Set();
  for (const f of files(out)) {
    if (!/\.(html|txt|js|json)$/.test(f)) continue;
    for (const m of readFileSync(f, "utf8").matchAll(/\/wp-media\/([^"'\s)\\?#<>]+)/g)) paths.add(m[1]);
  }
  console.log(`Copying ${paths.size} WordPress media files into out/wp-media …`);
  let failed = 0;
  // A few retries: the host (behind Cloudflare) sometimes drops a connection in a long run of downloads.
  const download = async (url) => {
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return Buffer.from(await res.arrayBuffer());
      } catch (err) {
        if (attempt === 4) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  };
  for (const p of paths) {
    try {
      const dest = join(out, "wp-media", ...decodeURIComponent(p).split("/"));
      const data = await download(uploads + p);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, data);
    } catch (err) {
      failed++;
      console.warn(`  ${uploads + p}: ${err.cause?.code ?? err.message}`);
    }
  }
  if (failed) console.warn(`  ${failed} media files could not be fetched.`);
} else {
  console.log("WP_API_URL not set – built from the bundled seed data.");
}

const php = (s) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
writeFileSync(
  join(out, "contact-config.php"),
  `<?php\n// Written by tools/pack-static.mjs – settings for contact.php.\nreturn [\n  'wp_api_url' => ${php(WP_API_URL)},\n  'secret' => ${php(REVALIDATE_SECRET)},\n  'contact_email' => ${php(CONTACT_EMAIL)},\n];\n`,
);
if (!WP_API_URL && !CONTACT_EMAIL) console.warn("Neither WP_API_URL nor CONTACT_EMAIL is set – the contact form will return an error.");

writeFileSync(
  join(out, ".htaccess"),
  `# Written by tools/pack-static.mjs
DirectoryIndex index.html index.php
ErrorDocument 404 /404.html
Options -Indexes

<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|woff2?)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 30 days"
  ExpiresByType image/png "access plus 30 days"
  ExpiresByType image/jpeg "access plus 30 days"
  ExpiresByType application/pdf "access plus 7 days"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
`,
);

const dist = join(site, "dist-static");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
console.log("Creating dist-static/stripline-static.tar.gz …");
// Relative paths only, so GNU tar (Git Bash) does not read "C:" as a remote host.
execSync("tar -czf ../dist-static/stripline-static.tar.gz .", { cwd: out, stdio: "inherit" });
console.log(`Done: ${join(dist, "stripline-static.tar.gz")}${existsSync(join(out, "index.html")) ? "" : " (warning: out/index.html missing)"}`);
