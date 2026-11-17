// Crops the app captures in _design/captures into web images in images/app/.
// Run from website/: node _tools/crop-captures.mjs   (macOS: uses sips)
// sips quirk: a crop whose offset + height reaches the image's edge is silently skipped, so keep rects
// a few points inside the edge (see ipad-progress).
// Each job: [device, capture, output name, mode, output width].
// mode "stage" = the stage card rect from the capture's .json, "stage+bar" = the card down through the
// play bar, "full" = the whole capture, or [x, y, w, h] in points (the json's window coordinates).
import { execFileSync } from 'node:child_process';
// Always work in website/, wherever it's run from.
process.chdir(new URL('..', import.meta.url).pathname);
import { readFileSync, mkdirSync, existsSync } from 'node:fs';

const jobs = [
  ['iphone-6.3', 's1-strumming', 'strumming-both-hands', [0, 54, 402, 800], 720],
  ['iphone-6.3', '4-drill-fret-hand', 'fret-hand', 'stage', 720],
  ['iphone-6.3', 's2-strum-hand', 'strum-hand', 'stage', 720],
  ['iphone-6.3', '5-drill-both-hands', 'both-hands', 'stage', 720],
  ['iphone-6.3', '5d-fingerstyle-travis', 'fingerstyle-travis', 'stage', 720],
  ['iphone-6.3', '0-welcome', 'welcome', [0, 40, 402, 720], 720],
  ['iphone-6.3', '1b-map-top', 'practice-next', [0, 97, 402, 510], 720],
  ['iphone-6.3', '8d-sprint-listening', 'sprint', [10, 52, 382, 600], 720],
  ['iphone-6.3', '7-shuffle-simple', 'shuffle', 'stage', 720],
  ['iphone-6.3', '9-shapes', 'shapes', [0, 52, 402, 560], 720],
  ['iphone-6.3', '2-drill', 'drill-setup', [0, 40, 402, 740], 720],
  ['iphone-6.3', 's3-strum-patterns', 'strum-patterns', [0, 40, 402, 700], 720],
  ['iphone-6.3', 's5-own-pattern', 'strum-editor', [0, 40, 402, 760], 720],
  ['iphone-6.3', '5e-fingerstyle-options', 'picking-styles', [0, 40, 402, 700], 720],
  ['iphone-6.3', '5e3-pick-pattern-editor', 'picking-editor', [0, 40, 402, 520], 720],
  ['ipad', '1-map', 'ipad-progress', [0, 24, 1376, 1004], 1600],
  ['mac', 's1-strumming', 'mac-strumming', 'full', 1600],
  ['mac', '5d-fingerstyle-travis', 'mac-fingerstyle', 'full', 1600],
];

const src = '_design/captures';
const out = 'images/app';
mkdirSync(out, { recursive: true });
const dims = f => {
  const t = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f]).toString();
  return [+t.match(/pixelWidth: (\d+)/)[1], +t.match(/pixelHeight: (\d+)/)[1]];
};
for (const [dev, name, outName, mode, width] of jobs) {
  const file = `${src}/${dev}/${name}.jpg`;
  const target = `${out}/${outName}.jpg`;
  const [W, H] = dims(file);
  let rect = [0, 0, W, H];
  if (mode !== 'full') {
    const j = JSON.parse(readFileSync(`${src}/${dev}/${name}.json`, 'utf8'));
    const s = W / j.windowWidth;
    let [x, y, w, h] = Array.isArray(mode) ? mode : [j.x, j.y, j.width, j.height];
    if (mode === 'stage+bar') {
      const x0 = Math.min(j.x, j.barX), x1 = Math.max(j.x + j.width, j.barX + j.barWidth);
      x = x0; w = x1 - x0; h = j.barY + j.barHeight - y;
    }
    rect = [x * s, y * s, w * s, h * s].map(Math.round);
    rect[2] = Math.min(rect[2], W - rect[0]); rect[3] = Math.min(rect[3], H - rect[1]);
  }
  const [x, y, w, h] = rect;
  execFileSync('sips', ['-c', String(h), String(w), '--cropOffset', String(y), String(x), file, '--out', target]);
  execFileSync('sips', ['--resampleWidth', String(Math.min(width, w)), '-s', 'formatOptions', '74', target]);
  const [ow, oh] = dims(target);
  console.log(`${target} ${ow}x${oh}`);
}
