// Stamps the shared head tags, header and footer into every page, between marker comments:
//   <!-- head:start --> … <!-- head:end -->       icons, stylesheet, Smart App Banner, Open Graph, Twitter
//   <!-- header:start --> … <!-- header:end -->   site header and nav
//   <!-- footer:start --> … <!-- footer:end -->   site footer
// Each page keeps its own <title> and <meta name="description"> above the head markers; the
// Open Graph and Twitter tags are made from them. Run from website/ after editing a page or a
// partial below, and commit the output:  node _tools/stamp.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
// Always work in website/, wherever it's run from.
process.chdir(new URL('..', import.meta.url).pathname);
import { join, relative } from 'node:path';

const SITE = 'https://chordmentor.nickcoleman.io';
const APP = 'https://apps.apple.com/app/id6827199615';
const OG_IMAGE = '/images/og-card.jpg';

const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    if (f.startsWith('_') || f.startsWith('.') || f === 'node_modules') continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.push(p);
  }
})('.');

const esc = s => s.replace(/&(?!\w+;)/g, '&amp;').replace(/"/g, '&quot;');

for (const file of pages) {
  let html = readFileSync(file, 'utf8');
  const rel = relative('.', file);
  const path = '/' + rel.replace(/index\.html$/, '');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'ChordMentor';
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '';
  const ogTitle = title.replace(/&amp;/g, '&');

  const head = `
<meta name="apple-itunes-app" content="app-id=6827199615">
<link rel="canonical" href="${SITE}${path}">
<link rel="icon" href="/images/icon.png">
<link rel="apple-touch-icon" href="/images/icon.png">
<meta name="theme-color" content="#F8F5F0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14110F" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChordMentor">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="ChordMentor's string lanes and chord diagrams beside the app on iPhone">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}${OG_IMAGE}">
<link rel="stylesheet" href="/style.css">
<script src="/js/device.js"></script>
`;

  const cur = (match) => (match ? ' aria-current="page"' : '');
  const header = `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/"${path === '/' ? ' aria-current="page"' : ''}><img src="/images/icon.png" alt="" width="30" height="30"><span>ChordMentor</span></a>
    <div class="device-switch" role="group" aria-label="Show screens for">
      <button type="button" data-device-pick="iphone" aria-pressed="true" title="iPhone"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg><span>iPhone</span></button>
      <button type="button" data-device-pick="ipad" aria-pressed="false" title="iPad"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M11 18h2"/></svg><span>iPad</span></button>
      <button type="button" data-device-pick="mac" aria-pressed="false" title="Mac"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="10.5" rx="1.5"/><path d="M2 19h20"/></svg><span>Mac</span></button>
    </div>
    <nav class="site-nav" aria-label="Main">
      <a href="/guides/"${cur(path.startsWith('/guides/'))}>Guides</a>
      <a class="nav-support" href="/support.html"${cur(path === '/support.html')}>Support</a>
      <a class="button small" href="${APP}">Get the app</a>
    </nav>
  </div>
</header>
`;

  const footer = `
<footer class="site-footer">
  <div class="wrap">
    <nav aria-label="Footer">
      <a href="/guides/">Guides</a>
      <a href="/support.html">Support</a>
      <a href="/privacy.html">Privacy</a>
      <a href="${APP}">App Store</a>
    </nav>
    <p>© 2026 Nick Coleman</p>
  </div>
</footer>
`;

  const put = (name, body) => {
    const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
    if (!re.test(html)) throw new Error(`${rel}: missing ${name} markers`);
    html = html.replace(re, `$1${body}$2`);
  };
  put('head', head);
  put('header', header);
  put('footer', footer);
  writeFileSync(file, html);
  console.log('stamped', rel);
}
