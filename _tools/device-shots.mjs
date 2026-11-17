// Makes the iPhone, iPad and Mac versions of the screens the device switch swaps, into
// images/app/{iphone,ipad,mac}/. Captures come from the QA tour (jpg + json per shot):
//   node _tools/device-shots.mjs <captures dir with iphone-6.3/, ipad/, mac/>
// mode "full" = the whole capture, "stage" = the stage card rect from the shot's .json, or
// [x, y, w, h] as fractions of the capture. A job's devices list limits it to those devices
// (iPhone keeps the hand-cropped images in images/app/ made by crop-captures.mjs).
// sips quirk: a crop that reaches the image's edge is silently skipped; stage rects stay inside.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve(process.argv[2] || '');
process.chdir(new URL('..', import.meta.url).pathname);
const devices = { iphone: 'iphone-6.3', ipad: 'ipad', mac: 'mac' };
const width = { iphone: { full: 600, stage: 720 }, ipad: { full: 1600, stage: 900 }, mac: { full: 1600, stage: 900 } };
const jobs = [
  ['s1-strumming', 'strumming', 'full'],
  ['5d-fingerstyle-travis', 'fingerstyle', 'full'],
  ['1-map', 'progress', 'full'],
  ['4-drill-fret-hand', 'fret-hand', 'stage'],
  ['s2-strum-hand', 'strum-hand', 'stage'],
  ['5-drill-both-hands', 'both-hands', 'stage'],
  // iPad and Mac versions of the images the iPhone crops in images/app/ show.
  ['0-welcome', 'welcome', 'full', ['ipad', 'mac'], 1200],
  ['1-map', 'practice-next', { ipad: [0.005, 0.09, 0.58, 0.36], mac: [0.18, 0.075, 0.555, 0.56] }, ['ipad', 'mac'], 1200],
  ['2-drill', 'drill-setup', 'full', ['ipad', 'mac'], 1200],
  ['8d-sprint-listening', 'sprint', 'full', ['ipad', 'mac'], 1200],
  ['7-shuffle-simple', 'shuffle', 'full', ['ipad', 'mac'], 1200],
  ['9-shapes', 'shapes', 'full', ['ipad', 'mac'], 1200],
];
const dims = f => {
  const t = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f]).toString();
  return [+t.match(/pixelWidth: (\d+)/)[1], +t.match(/pixelHeight: (\d+)/)[1]];
};
for (const [dev, dir] of Object.entries(devices)) {
  mkdirSync(`images/app/${dev}`, { recursive: true });
  for (const [shot, name, jobMode, only, size] of jobs) {
    if (only && !only.includes(dev)) continue;
    const mode = jobMode && !Array.isArray(jobMode) && typeof jobMode === 'object' ? jobMode[dev] : jobMode;
    const file = `${src}/${dir}/${shot}.jpg`;
    const target = `images/app/${dev}/${name}.jpg`;
    const [W, H] = dims(file);
    let [x, y, w, h] = [0, 0, W, H];
    if (mode === 'stage') {
      const j = JSON.parse(readFileSync(`${src}/${dir}/${shot}.json`, 'utf8'));
      const s = W / j.windowWidth;
      [x, y, w, h] = [j.x, j.y, j.width, j.height].map(v => Math.round(v * s));
      w = Math.min(w, W - x - 1); h = Math.min(h, H - y - 1);
    } else if (Array.isArray(mode)) {
      [x, y, w, h] = [mode[0] * W, mode[1] * H, mode[2] * W, mode[3] * H].map(Math.round);
      w = Math.min(w, W - x - 1); h = Math.min(h, H - y - 1);
    }
    if (mode === 'full') copyFileSync(file, target);
    else execFileSync('sips', ['-c', String(h), String(w), '--cropOffset', String(y), String(x), file, '--out', target]);
    execFileSync('sips', ['--resampleWidth', String(Math.min(size || width[dev][mode === 'stage' ? 'stage' : 'full'], w)), '-s', 'formatOptions', '74', target]);
    const [ow, oh] = dims(target);
    console.log(`${target} ${ow}x${oh}`);
  }
}
