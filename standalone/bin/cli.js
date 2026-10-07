#!/usr/bin/env node
/* DWAO AI — Accessibility Scan CLI
   Runs standalone/src/audit-engine.js against pages in a headless browser and
   writes a JSON + HTML report. See ../README.md for usage. */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const HELP = `
dwao-a11y-scan — WCAG 2.2 accessibility scanner

Usage:
  dwao-a11y-scan <url|directory> [options]

Targets:
  http://localhost:3000        Scan a single URL
  http://localhost:3000 --crawl   Scan that URL + same-origin pages it links to
  ./dist                       Recursively scan every .html file under a directory

Options:
  --crawl              Follow same-origin links from the starting URL
  --max-pages <n>       Max pages to visit when crawling (default: 20)
  --out <dir>           Report output directory (default: ./a11y-report)
  --fail-on <level>     Exit non-zero on 'fail' (default) or 'warn'
  --channel <name>       Browser channel: chrome (default), msedge, chromium
  -h, --help             Show this help

Examples:
  dwao-a11y-scan http://localhost:3000 --crawl --max-pages 30
  dwao-a11y-scan ./dist --out ./reports/a11y
`;

function parseArgs(argv) {
  const opts = { crawl: false, maxPages: 20, out: 'a11y-report', failOn: 'fail', channel: 'chrome', target: null };
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(HELP);
    process.exit(args.length === 0 ? 1 : 0);
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--crawl') opts.crawl = true;
    else if (a === '--max-pages') opts.maxPages = parseInt(args[++i], 10);
    else if (a === '--out') opts.out = args[++i];
    else if (a === '--fail-on') opts.failOn = args[++i];
    else if (a === '--channel') opts.channel = args[++i];
    else if (!opts.target) opts.target = a;
    else { console.error(`Unrecognized argument: ${a}`); process.exit(1); }
  }
  if (!opts.target) { console.error('Missing <url|directory> target.\n' + HELP); process.exit(1); }
  if (!['fail', 'warn'].includes(opts.failOn)) { console.error(`--fail-on must be 'fail' or 'warn'`); process.exit(1); }
  return opts;
}

function collectHtmlFiles(dir) {
  const skip = new Set(['node_modules', '.git', '.next', '.cache']);
  const out = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && /\.html?$/i.test(entry.name)) out.push(full);
    }
  })(dir);
  return out;
}

async function launchBrowser(preferredChannel) {
  const candidates = [preferredChannel, 'msedge', undefined].filter((v, i, a) => a.indexOf(v) === i);
  let lastErr;
  for (const channel of candidates) {
    try {
      return await chromium.launch(channel ? { channel } : {});
    } catch (e) { lastErr = e; }
  }
  throw new Error(
    `Could not launch a browser (tried: ${candidates.filter(Boolean).join(', ')}, bundled chromium).\n` +
    `Install Google Chrome, or run:\n  npm install playwright && npx playwright install chromium\n` +
    `Original error: ${lastErr && lastErr.message}`
  );
}

function scoreOf(totals) {
  if (totals.fail === 0 && totals.warn === 0) return 100;
  return Math.max(0, Math.round(100 - (totals.fail * 8 + totals.warn * 3)));
}

function countResults(results) {
  const t = { fail: 0, warn: 0, pass: 0, manual: 0, na: 0, total: 0, issues: 0 };
  for (const r of results) { t.total++; t[r.status] = (t[r.status] || 0) + 1; if (r.issues) t.issues += r.issues.length; }
  return t;
}

async function auditPage(browser, url, auditEngineSrc) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() =>
      page.goto(url, { waitUntil: 'load', timeout: 20000 })
    );
    await page.addScriptTag({ content: auditEngineSrc });
    const results = await page.evaluate(() => window.__ofAudit.run());
    const links = await page.$$eval('a[href]', as => as.map(a => a.href)).catch(() => []);
    return { url, results, links };
  } finally {
    await page.close();
  }
}

function sameOrigin(a, b) {
  try { return new URL(a).origin === new URL(b).origin; } catch { return false; }
}

function renderHtmlReport(meta, pages) {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = pages.map(p => `
    <tr>
      <td><a href="${esc(p.url)}">${esc(p.url)}</a></td>
      <td style="text-align:center;font-weight:600;color:${p.score >= 90 ? '#1a7f37' : p.score >= 70 ? '#9a6700' : '#cf222e'}">${p.score}</td>
      <td style="text-align:center;color:#cf222e">${p.totals.fail}</td>
      <td style="text-align:center;color:#9a6700">${p.totals.warn}</td>
      <td style="text-align:center;color:#1a7f37">${p.totals.pass}</td>
    </tr>`).join('');

  const details = pages.map(p => {
    const fails = p.results.filter(r => r.status === 'fail' || r.status === 'warn');
    if (!fails.length) return '';
    const items = fails.map(r => `
      <div style="border:1px solid #d0d7de;border-radius:6px;padding:10px 14px;margin:8px 0">
        <div style="font-weight:600;color:${r.status === 'fail' ? '#cf222e' : '#9a6700'}">
          [${esc(r.status.toUpperCase())}] ${esc(r.name)} <span style="font-weight:400;color:#57606a">(${esc(r.level)} · ${esc(r.principle)})</span>
        </div>
        <div style="margin-top:4px;color:#24292f">${esc(r.summary)}</div>
        ${(r.issues || []).slice(0, 10).map(iss => `
          <div style="margin-top:6px;padding-left:10px;border-left:2px solid #d0d7de;font-size:13px">
            <div>${esc(iss.msg)}</div>
            ${iss.fix ? `<div style="color:#57606a">Fix: ${esc(iss.fix)}</div>` : ''}
            ${iss.snippet ? `<code style="display:block;background:#f6f8fa;padding:4px 6px;margin-top:4px;border-radius:4px;overflow-x:auto;white-space:pre">${esc(iss.snippet)}</code>` : ''}
          </div>`).join('')}
      </div>`).join('');
    return `<h3 style="margin-top:28px">${esc(p.url)}</h3>${items}`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>WCAG 2.2 Accessibility Report</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:960px;margin:40px auto;padding:0 20px;color:#24292f">
  <h1>WCAG 2.2 Accessibility Report</h1>
  <p style="color:#57606a">Generated ${esc(meta.generated)} · ${pages.length} page(s) scanned</p>
  <table style="border-collapse:collapse;width:100%;margin-top:16px">
    <thead><tr style="border-bottom:2px solid #d0d7de;text-align:left">
      <th style="padding:8px 4px">Page</th><th style="padding:8px 4px;text-align:center">Score</th>
      <th style="padding:8px 4px;text-align:center">Fail</th><th style="padding:8px 4px;text-align:center">Warn</th>
      <th style="padding:8px 4px;text-align:center">Pass</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${details}
</body></html>`;
}

async function main() {
  const opts = parseArgs(process.argv);
  const auditEngineSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'audit-engine.js'), 'utf8');

  let targets = [];
  const isUrl = /^https?:\/\//i.test(opts.target);
  if (isUrl) {
    targets = [opts.target];
  } else {
    const abs = path.resolve(opts.target);
    if (!fs.existsSync(abs)) { console.error(`Not found: ${opts.target}`); process.exit(1); }
    const files = fs.statSync(abs).isDirectory() ? collectHtmlFiles(abs) : [abs];
    if (!files.length) { console.error(`No .html files found under ${opts.target}`); process.exit(1); }
    targets = files.map(f => 'file://' + f);
  }

  console.log(`Launching browser (channel: ${opts.channel})...`);
  const browser = await launchBrowser(opts.channel);

  const visited = new Set();
  const queue = [...targets];
  const pages = [];

  try {
    while (queue.length && pages.length < (opts.crawl ? opts.maxPages : targets.length)) {
      const url = queue.shift();
      if (visited.has(url)) continue;
      visited.add(url);

      process.stdout.write(`Scanning ${url} ... `);
      let result;
      try {
        result = await auditPage(browser, url, auditEngineSrc);
      } catch (e) {
        console.log(`FAILED (${e.message})`);
        continue;
      }
      const totals = countResults(result.results);
      const score = scoreOf(totals);
      console.log(`score ${score} · ${totals.fail} fail · ${totals.warn} warn`);
      pages.push({ url, results: result.results, totals, score });

      if (opts.crawl && isUrl) {
        for (const link of result.links) {
          const clean = link.split('#')[0];
          if (clean && sameOrigin(clean, targets[0]) && !visited.has(clean) && !queue.includes(clean)) {
            queue.push(clean);
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  const aggregate = pages.reduce((acc, p) => {
    for (const k of ['fail', 'warn', 'pass', 'manual', 'na', 'total', 'issues']) acc[k] += p.totals[k] || 0;
    return acc;
  }, { fail: 0, warn: 0, pass: 0, manual: 0, na: 0, total: 0, issues: 0 });

  const meta = { generated: new Date().toISOString(), tool: 'DWAO AI — Accessibility Scan CLI', target: opts.target };

  fs.mkdirSync(opts.out, { recursive: true });
  fs.writeFileSync(path.join(opts.out, 'a11y-report.json'), JSON.stringify({ meta, aggregate, pages }, null, 2));
  fs.writeFileSync(path.join(opts.out, 'a11y-report.html'), renderHtmlReport(meta, pages));

  console.log(`\n${pages.length} page(s) scanned — ${aggregate.fail} fail, ${aggregate.warn} warn, ${aggregate.pass} pass`);
  console.log(`Report written to ${path.resolve(opts.out)}/a11y-report.{json,html}`);

  const failing = opts.failOn === 'warn' ? aggregate.fail + aggregate.warn : aggregate.fail;
  process.exitCode = failing > 0 ? 1 : 0;
}

main().catch(e => { console.error(e); process.exit(1); });
