/*
 * Cloudflare Pages build for 물살림 AI.
 *
 * Ships ONLY the live v12 flow (dependency-mapped) and makes it CSP-safe.
 * The source repo keeps the versioned "russian-doll" files untouched (the Node
 * origin server still builds from them); the CSP-unfriendly parts are resolved
 * here at build time so the published static site works under a strict CSP that
 * does NOT allow 'unsafe-eval'.
 *
 * Two classes of runtime hack are neutralised at build time:
 *   1. eval loaders  — three "-v2/-loader" scripts fetch an older base script as
 *      text, string-replace filenames, then (0,eval)() it. eval is blocked by the
 *      Pages CSP, so we pre-resolve each into a flat, plain <script>.
 *   2. stale back-links — a few "return to region select" links were never bumped
 *      to v12 (pointed at v8/v9/v10). We rewrite them to v12 in the shipped copies.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const read = (f) => readFile(path.join(root, f), 'utf8');
const emit = (f, s) => writeFile(path.join(out, f), s, 'utf8');
const copy = (f) => cp(path.join(root, f), path.join(out, f));

const ENTRY = 'mulsallim-public-county-v12.html';

// --- Files copied verbatim (live v12 flow only) --------------------------------
const COPY_HTML = [
  ENTRY,
  'mulsallim-public-v2.html',              // landing base template
  'mulsallim-dashboard-county-v12.html',
  'mulsallim-dashboard-county-v8.html',    // dashboard base template
  'mulsallim-action.html',                 // dashboard body template
  'mulsallim-action-card-v2.html',         // public share-card shell
  'mulsallim-action-card.html',            // public share-card base
  'mulsallim-ai-model-card-v2.html',       // model card base
];
const COPY_JS = [
  'mulsallim-landing-polish.js',
  'mulsallim-action.js',
  'mulsallim-service-ux.js',
  'mulsallim-revisit.js',
  'mulsallim-practice.js',
  'mulsallim-accessibility.js',
  'mulsallim-ai-governance.js',
  'mulsallim-ai-upgrade-v2.js',
  'mulsallim-dashboard-polish.js',
  'mulsallim-pilot-link.js',
  'mulsallim-regions-county-v3.js',
  'mulsallim-pilot.js',
];
const COPY_OTHER = ['mulsallim-action.css', 'model-evaluation.json', '_headers'];

// --- Build ---------------------------------------------------------------------
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const f of [...COPY_HTML, ...COPY_JS, ...COPY_OTHER]) await copy(f);

// 1) Neutralise the three eval loaders.
//    Original pattern: fetch(base.js) as text, string-replace filenames, then
//    (0,eval)() it — blocked by the CSP (no 'unsafe-eval'). We instead ship the
//    string-replaced base as a real file and have the loader inject it as a plain
//    <script src>. This preserves the original ASYNC "run after the page's own
//    synchronous scripts" timing (collaboration.js reads the `target` global that
//    mulsallim-action.js sets) while staying within `script-src 'self'`.
async function resolveLoader(loaderName, baseFile, [find, replace]) {
  const builtName = baseFile.replace(/\.js$/, '.built.js');
  await emit(builtName, (await read(baseFile)).replaceAll(find, replace));
  await emit(
    loaderName,
    `(function(){var s=document.createElement('script');s.src=${JSON.stringify(builtName)};(document.body||document.documentElement).appendChild(s);})();`,
  );
}
await resolveLoader(
  'mulsallim-public-county-v12-loader.js',
  'mulsallim-public-county-v5.js',
  ['mulsallim-dashboard-county-v5.html', 'mulsallim-dashboard-county-v12.html'],
);
await resolveLoader(
  'mulsallim-collaboration-v2.js',
  'mulsallim-collaboration.js',
  ['mulsallim-action-card.html', 'mulsallim-action-card-v2.html'],
);
await resolveLoader(
  'mulsallim-action-card-v2.js',
  'mulsallim-action-card.js',
  // original loader targeted the stale v10 entry; ship v12.
  ['mulsallim-public-county-v4.html', ENTRY],
);

// 2) Ship the model card with its back-link bumped v9 -> v12.
await emit(
  'mulsallim-ai-model-card-v3.html',
  (await read('mulsallim-ai-model-card-v3.html'))
    .replaceAll('mulsallim-public-county-v9.html', ENTRY),
);

// 3) Ship the pilot page with its static back-link bumped v8 -> v12.
await emit(
  'mulsallim-pilot.html',
  (await read('mulsallim-pilot.html'))
    .replaceAll('mulsallim-public-county-v8.html', ENTRY),
);

// 4) Root redirect to the entry.
await emit(
  'index.html',
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>물살림 AI</title><meta http-equiv="refresh" content="0;url=/${ENTRY}"></head><body><p><a href="/${ENTRY}">물살림 AI 시작하기</a></p></body></html>`,
);

console.log('build:pages complete → dist/ (CSP-safe, live v12 flow only)');
