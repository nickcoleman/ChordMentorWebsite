// The live tab-lane card: Fingerstyle's string lanes playing Travis with a Pinch on C to G at
// 100 BPM, as the app draws them. Tap Play to hear the acoustic guide guitar (notes cut from the
// app's own sample bank, see _tools/extract-notes.py). Sound only ever starts from a tap.
(() => {
  'use strict';
  const card = document.querySelector('[data-tabcard]');
  if (!card) return;

  const BPM = 100;
  const EIGHTH = 60 / BPM / 2;
  const BAR = EIGHTH * 8;
  const AUDIO = card.getAttribute('data-audio') || '/audio/travis/';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // PickPatterns "travis-pinch": B+a, m, A, i, B2, m, A, i (ChordCore/PickPattern.swift).
  const PATTERN = [['B', 'a'], ['m'], ['A'], ['i'], ['B2'], ['m'], ['A'], ['i']];
  const FINGER = { B: 'p', A: 'p', B2: 'p', i: 'i', m: 'm', a: 'a' };
  // [string from low E = 0, fret, off the chord shape]. Thumb strings from Chord.thumbNotes:
  // C goes A, D, low E (the ring finger hops to fret 3), D; G goes 6, 4, 5, 4.
  const CHORDS = [
    { name: 'C', roles: { B: [1, 3], A: [2, 2], B2: [0, 3, true], i: [3, 0], m: [4, 1], a: [5, 0] },
      dots: [[1, 3, 3], [2, 2, 2], [4, 1, 1]], open: [3, 5], hop: [0, 3] },
    { name: 'G', roles: { B: [0, 3], A: [2, 0], B2: [1, 2], i: [3, 0], m: [4, 0], a: [5, 3] },
      dots: [[0, 3, 2], [1, 2, 1], [5, 3, 3]], open: [2, 3, 4] },
  ];
  const FINGER_COLORS = { 1: '#5CA8FF', 2: '#45D68C', 3: '#FFB340', 4: '#C48CFF' };
  const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const h = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // ---- Chord diagrams (finger colors mean fingers 1 to 4, as in the app).
  function diagram(chord) {
    const s = el('svg', { viewBox: '0 0 60 62', 'aria-hidden': 'true' });
    const x = i => 8 + i * 8.8, y = f => 10 + f * 11;
    for (let i = 0; i < 6; i++) el('line', { x1: x(i), y1: y(0), x2: x(i), y2: y(4.4), stroke: 'currentColor', 'stroke-width': .8, opacity: .55 }, s);
    for (let f = 1; f <= 4; f++) el('line', { x1: x(0), y1: y(f), x2: x(5), y2: y(f), stroke: 'currentColor', 'stroke-width': .8, opacity: .4 }, s);
    el('line', { x1: x(0) - .5, y1: y(0), x2: x(5) + .5, y2: y(0), stroke: 'currentColor', 'stroke-width': 2.4 }, s);
    for (const o of chord.open) el('circle', { cx: x(o), cy: 5, r: 2.2, fill: 'none', stroke: 'currentColor', 'stroke-width': .9 }, s);
    if (chord.hop) el('circle', { cx: x(chord.hop[0]), cy: y(chord.hop[1] - .5), r: 3.6, fill: 'none', stroke: '#544AB8', 'stroke-width': .9, 'stroke-dasharray': '1.6 1.6' }, s);
    for (const [str, fret, finger] of chord.dots) {
      el('rect', { x: x(str) - 3.8, y: y(fret - .5) - 3.8, width: 7.6, height: 7.6, rx: 2, fill: FINGER_COLORS[finger], stroke: 'rgba(0,0,0,.25)', 'stroke-width': .5 }, s);
    }
    return s;
  }

  // ---- Build the card.
  card.textContent = '';
  card.classList.add('is-live');

  const top = h('div', 'tc-top');
  const stage = h('div', 'tc-stage', 'Both Hands · bar <span data-bar>1</span>');
  const chordsBox = h('div', 'tc-chords');
  const nowCard = h('div', 'tc-chord now');
  const arrow = h('span', 'tc-arrow', '→');
  arrow.setAttribute('aria-hidden', 'true');
  const nextCard = h('div', 'tc-chord next');
  chordsBox.append(nowCard, arrow, nextCard);
  top.append(chordsBox, (() => {
    const beats = h('div', 'tc-beats');
    beats.setAttribute('aria-hidden', 'true');
    for (let b = 1; b <= 4; b++) beats.appendChild(h('span', 'tc-beat', String(b)));
    return beats;
  })());

  const name = h('p', 'tc-name', 'Travis with a Pinch · 4/4');

  const W = 560, X0 = 30, GHOST = 46, SLOT = (W - X0 - GHOST) / 8, LANE_Y = i => 16 + (5 - i) * 22, HGT = 166;
  const svg = el('svg', { class: 'tc-lanes', viewBox: `0 0 ${W} ${HGT}`, role: 'img',
    'aria-label': 'String lanes for Travis with a Pinch, C to G: the thumb plays the bass strings on every beat while the index, middle and ring fingers pick the G, B and high e strings in between.' });
  const noteX = k => X0 + SLOT * (k + .5);
  for (const b of [0, 4]) el('rect', { class: 'band', x: X0 + SLOT * b + 4, y: 4, width: SLOT * 2 - 8, height: LANE_Y(0) - 4 + 10, rx: 8 }, svg);
  const lanes = [];
  for (let i = 0; i < 6; i++) {
    lanes[i] = el('line', { class: 'lane', x1: X0, y1: LANE_Y(i), x2: W - 4, y2: LANE_Y(i) }, svg);
    const t = el('text', { class: 'lane-label', x: 8, y: LANE_Y(i) + 4 }, svg);
    t.textContent = STRING_NAMES[i];
  }
  el('line', { class: 'barline', x1: W - GHOST + 6, y1: 6, x2: W - GHOST + 6, y2: LANE_Y(0) + 10 }, svg);
  const counts = ['1', '+', '2', '+', '3', '+', '4', '+'];
  counts.forEach((c, k) => {
    const t = el('text', { class: 'count' + (c === '+' ? ' and' : ''), x: noteX(k), y: HGT - 8 }, svg);
    t.textContent = c;
  });
  const nextName = el('text', { class: 'next-name', x: W - GHOST / 2 + 2, y: HGT - 8 }, svg);
  const notesLayer = el('g', {}, svg);
  const playhead = el('line', { class: 'playhead', x1: noteX(0), y1: 4, x2: noteX(0), y2: LANE_Y(0) + 12 }, svg);

  const bar = h('div', 'tc-bar');
  const play = h('button', 'button tc-play',
    '<svg class="i-play" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M5 3.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L6.2 2.8A.8.8 0 0 0 5 3.5Z"/></svg>' +
    '<svg class="i-stop" viewBox="0 0 20 20" aria-hidden="true"><rect fill="currentColor" x="4" y="4" width="12" height="12" rx="2"/></svg>' +
    '<span data-label>Play</span>');
  play.type = 'button';
  play.setAttribute('aria-pressed', 'false');
  const lcd = h('div', 'tc-lcd',
    '<div><b>100</b><span>BPM</span></div><div><b data-barbeat>1.1</b><span>BAR.BEAT</span></div><div><b data-time>0:00</b><span>TIME</span></div>');
  lcd.setAttribute('aria-hidden', 'true');
  bar.append(play, lcd);
  const status = h('p', 'visually-hidden');
  status.setAttribute('aria-live', 'polite');

  card.append(stage, top, name, svg, bar, status);

  const $bar = stage.querySelector('[data-bar]');
  const $barbeat = lcd.querySelector('[data-barbeat]');
  const $time = lcd.querySelector('[data-time]');
  const $label = play.querySelector('[data-label]');
  const beatEls = [...top.querySelectorAll('.tc-beat')];

  // ---- Notes for one bar of a chord.
  let noteEls = [];
  function slotNotes(chord, k) {
    return PATTERN[k].map(role => {
      const [string, fret, hop] = chord.roles[role];
      return { role, string, fret, hop: !!hop, finger: FINGER[role] };
    });
  }
  function drawBar(chordIndex) {
    const chord = CHORDS[chordIndex % 2];
    const next = CHORDS[(chordIndex + 1) % 2];
    notesLayer.textContent = '';
    noteEls = [];
    for (let k = 0; k < 8; k++) {
      const ns = slotNotes(chord, k);
      if (ns.length > 1) {
        const ys = ns.map(n => LANE_Y(n.string));
        el('line', { class: 'stem', x1: noteX(k), x2: noteX(k), y1: Math.min(...ys), y2: Math.max(...ys) }, notesLayer);
      }
      noteEls[k] = ns.map(n => noteDot(n, noteX(k), notesLayer));
    }
    // The next chord's first beat, faded, past the bar line.
    const ghost = el('g', { class: 'ghost' }, notesLayer);
    for (const n of slotNotes(next, 0)) noteDot(n, W - GHOST / 2 + 2, ghost);
    nextName.textContent = next.name;
    setChordCard(nowCard, 'NOW', chord);
    setChordCard(nextCard, 'NEXT', next);
  }
  function noteDot(n, x, parent) {
    const g = el('g', { class: 'note ' + (n.finger === 'p' ? 'p' : 'f') }, parent);
    const y = LANE_Y(n.string);
    if (n.hop) el('circle', { class: 'hop', cx: x, cy: y, r: 15 }, g);
    el('circle', { cx: x, cy: y, r: 11 }, g);
    const t = el('text', { x, y: y + .5 }, g);
    t.textContent = n.finger;
    g._string = n.string;
    return g;
  }
  function setChordCard(box, label, chord) {
    box.textContent = '';
    box.dataset.chord = chord.name;
    box.append(h('small', null, label), diagram(chord), h('b', null, chord.name));
    box.setAttribute('aria-label', `${label === 'NOW' ? 'Now' : 'Next'}: ${chord.name}`);
  }

  // ---- Audio: a lookahead scheduler on the Web Audio clock.
  let ctx = null, master = null, bank = null, loading = null;
  let playing = false, t0 = 0, nextEighth = 0, timer = 0, raf = 0, shownBar = -1, silent = false;
  const voices = new Map();

  function loadBank() {
    if (loading) return loading;
    loading = (async () => {
      const manifest = await (await fetch(AUDIO + 'notes.json')).json();
      const files = [...new Set(Object.values(manifest.notes).map(n => n.file))];
      const buffers = {};
      await Promise.all(files.map(async f => {
        const data = await (await fetch(AUDIO + f + '.m4a')).arrayBuffer();
        buffers[f] = await new Promise((ok, fail) => ctx.decodeAudioData(data, ok, fail));
      }));
      bank = { notes: manifest.notes, buffers };
    })();
    return loading;
  }

  function playNote(string, fret, finger, time) {
    const key = `${string}:${fret}`;
    const n = bank && bank.notes[key];
    if (!n) return;
    const src = ctx.createBufferSource();
    src.buffer = bank.buffers[n.file];
    src.playbackRate.value = n.rate;
    const g = ctx.createGain();
    const level = finger === 'p' ? .9 : .75;
    g.gain.value = level;
    src.connect(g).connect(master);
    src.start(time);
    // A new note on a string stops the one before it, as a real string does.
    const prev = voices.get(string);
    if (prev) {
      prev.g.gain.setValueAtTime(prev.level, time);
      prev.g.gain.linearRampToValueAtTime(0, time + .04);
      try { prev.src.stop(time + .06); } catch (e) { /* already stopped */ }
    }
    voices.set(string, { src, g, level });
  }

  function schedule() {
    const horizon = ctx.currentTime + .2;
    while (t0 + nextEighth * EIGHTH < horizon) {
      const when = t0 + nextEighth * EIGHTH;
      const chord = CHORDS[Math.floor(nextEighth / 8) % 2];
      for (const n of slotNotes(chord, nextEighth % 8)) playNote(n.string, n.fret, n.finger, when);
      nextEighth++;
    }
  }

  const clock = () => (ctx && !silent ? ctx.currentTime : performance.now() / 1000);

  function frame() {
    if (!playing) return;
    const t = Math.max(0, clock() - t0);
    const barIndex = Math.floor(t / BAR);
    const pos = (t - barIndex * BAR) / EIGHTH; // eighths into the bar, 0 to 8
    if (barIndex !== shownBar) { shownBar = barIndex; drawBar(barIndex); }
    const slot = Math.min(7, Math.floor(pos));
    const beat = Math.floor(slot / 2);
    beatEls.forEach((b, i) => b.classList.toggle('on', i === beat));
    noteEls.forEach((group, k) => group.forEach(g => g.classList.toggle('lit', k === slot && pos - slot < .55)));
    lanes.forEach((l, i) => l.classList.toggle('ring', noteEls[slot] && noteEls[slot].some(g => g._string === i) && pos - slot < .9));
    const x = noteX(reduceMotion.matches ? slot : pos);
    playhead.setAttribute('x1', x); playhead.setAttribute('x2', x);
    $bar.textContent = barIndex + 1;
    $barbeat.textContent = `${barIndex + 1}.${beat + 1}`;
    const secs = Math.floor(t);
    $time.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    raf = requestAnimationFrame(frame);
  }

  async function start() {
    play.disabled = true;
    $label.textContent = 'Loading…';
    silent = false;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error('No Web Audio');
        // Let it sound with the iPhone's ring/silent switch on silent, like a video would.
        if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (e) { /* older Safari */ } }
        ctx = new AC();
      }
      if (ctx.state === 'suspended') await ctx.resume();
      await loadBank();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    } catch (e) {
      // No sound (an old browser or a failed download): the lanes still play, silently.
      silent = true;
      status.textContent = 'The sound didn’t load, so the lanes play without it.';
    }
    play.disabled = false;
    playing = true;
    play.setAttribute('aria-pressed', 'true');
    $label.textContent = 'Stop';
    t0 = clock() + .12;
    nextEighth = 0;
    shownBar = -1;
    if (!silent) { schedule(); timer = setInterval(schedule, 40); }
    if (!silent) status.textContent = 'Playing';
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    cancelAnimationFrame(raf);
    if (ctx && master && !silent) {
      const m = master;
      m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
      m.gain.linearRampToValueAtTime(0, ctx.currentTime + .15);
      setTimeout(() => m.disconnect(), 250);
      voices.clear();
    }
    play.setAttribute('aria-pressed', 'false');
    $label.textContent = 'Play';
    status.textContent = 'Stopped';
    beatEls.forEach(b => b.classList.remove('on'));
    noteEls.flat().forEach(g => g.classList.remove('lit'));
    lanes.forEach(l => l.classList.remove('ring'));
  }

  play.addEventListener('click', () => (playing ? stop() : start()));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  drawBar(0);
})();
