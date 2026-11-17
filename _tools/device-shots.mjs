// Makes the iPhone, iPad and Mac versions of the screens the device switch swaps, into
// images/app/{iphone,ipad,mac}/. Captures come from the QA tour (jpg + json per shot):
//   node _tools/device-shots.mjs <captures dir with iphone-6.3/, ipad/, mac/>
// mode "full" = the whole capture, "stage" = the stage card rect from the shot's .json.
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
];
const dims = f => {
  const t = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f]).toString();
  return [+t.match(/pixelWidth: (\d+)/)[1], +t.match(/pixelHeight: (\d+)/)[1]];
};
for (const [dev, dir] of Object.entries(devices)) {
  mkdirSync(`images/app/${dev}`, { recursive: true });
  for (const [shot, name, mode] of jobs) {
    const file = `${src}/${dir}/${shot}.jpg`;
    const target = `images/app/${dev}/${name}.jpg`;
    const [W, H] = dims(file);
    let [x, y, w, h] = [0, 0, W, H];
    if (mode === 'stage') {
      const j = JSON.parse(readFileSync(`${src}/${dir}/${shot}.json`, 'utf8'));
      const s = W / j.windowWidth;
      [x, y, w, h] = [j.x, j.y, j.width, j.height].map(v => Math.round(v * s));
      w = Math.min(w, W - x - 1); h = Math.min(h, H - y - 1);
    }
    if (mode === 'full') copyFileSync(file, target);
    else execFileSync('sips', ['-c', String(h), String(w), '--cropOffset', String(y), String(x), file, '--out', target]);
    execFileSync('sips', ['--resampleWidth', String(Math.min(width[dev][mode], w)), '-s', 'formatOptions', '74', target]);
    const [ow, oh] = dims(target);
    console.log(`${target} ${ow}x${oh}`);
  }
}
