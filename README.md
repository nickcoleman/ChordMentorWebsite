# ChordMentor website

Static site for GitHub Pages at chordmentor.nickcoleman.io (`CNAME`). Plain HTML and CSS, one small
script for the live tab-lane card. No build step on the server: what's in this folder is what's served.

## Preview locally

```sh
cd website
python3 -m http.server 8000
```

Then open http://localhost:8000. Pages use root paths (`/style.css`), so open them through the
server, not as files.

## Pages

| URL | File |
|---|---|
| `/` | `index.html` |
| `/guides/` | `guides/index.html` |
| `/guides/getting-started/` | `guides/getting-started/index.html` |
| `/guides/strumming/` | `guides/strumming/index.html` |
| `/guides/fingerstyle/` | `guides/fingerstyle/index.html` |
| `/support.html` | `support.html` (App Store Connect's Support URL: keep this path) |
| `/privacy.html` | `privacy.html` (App Store Connect's Privacy Policy URL: keep this path) |

Support email: chordmentor@nickcoleman.io.

## Shared header, footer and head tags

Every page has marker comments (`<!-- head:start -->`, `<!-- header:start -->`, `<!-- footer:start -->`
and their `:end` pairs). `_tools/stamp.mjs` fills them in: the Smart App Banner, icons, canonical URL,
Open Graph and Twitter tags (made from each page's `<title>` and meta description), the nav and the
footer. After editing a page's title or description, or the header or footer in the script, run:

```sh
node website/_tools/stamp.mjs
```

and commit the stamped pages. Folders starting with `_` (`_tools`, `_design`) aren't published by
GitHub Pages.

## Images

`images/app/` holds crops of the 1.2 app captures (light mode), made by `_tools/crop-captures.mjs`
from `_design/captures/` (macOS `sips`). To refresh after new captures, copy the new captures into
`_design/captures/` and run `node website/_tools/crop-captures.mjs`. The guide pages' numbered pins are
placed by percent over each image; if a screen's layout changes, check the pins.

`images/og-card.jpg` is the 1200x630 share image, rendered from `_tools/og-card.html` (instructions
inside it).

## The live tab-lane card

`js/tabcard.js` draws Fingerstyle's string lanes for Travis with a Pinch, C to G at 100 BPM, the way
the app does (pattern from `PickPatterns`, thumb strings from `Chord.thumbNotes`). Tap Play to hear
it. Sound never starts by itself, it stops when the tab is hidden, and with Reduce Motion the
playhead steps note to note instead of sweeping.

The notes are cut from the app's Acoustic sample bank (Nick's Taylor): seven short AAC files in
`audio/travis/` (about 170 KB), loaded only on the first tap, and pitched the way the app does it
(nearest recording on the string, played faster or slower). To regenerate:

```sh
afconvert -f WAVE -d LEI16@48000 App/Audio/Samples/AcousticSamples.caf /tmp/acoustic.wav
python3 -I website/_tools/extract-notes.py /tmp/acoustic.wav App/Audio/Samples/AcousticSamples.json /tmp/notes
for f in /tmp/notes/*.wav; do afconvert -f m4af -d aac -b 64000 -q 127 "$f" "${f%.wav}.m4a"; done
cp /tmp/notes/*.m4a /tmp/notes/notes.json website/audio/travis/
```

Without JavaScript the card shows a still of the Fingerstyle screen instead.

## Not done yet, and where it goes

- **Footage of Nick playing: optional, nothing waits on it.** The hero is the live card beside a
  real capture. If a hands loop is made later, it can replace the phone capture in `.hero-media`
  (spec in `_design/design-review.md`, "Hero loop": muted, 1600x900 H.264, poster, under 2.5 MB,
  `autoplay muted loop playsinline`, poster only under Reduce Motion).
- **Adding a clip to a guide.** Guides use annotated stills. To add a short clip, put a `<video>` in
  place of an image inside the step's `.shot` (or the page's `.guide-cover`), keep the step text as
  its caption, and version the file name:

  ```html
  <video src="/video/fingerstyle-lanes-1.2.mp4" poster="/images/app/fingerstyle-travis.jpg"
         width="720" height="900" muted loop playsinline preload="none"
         aria-label="The string lanes playing Travis with a Pinch"></video>
  ```

  Spec: 6 to 12 s, 720x900 (4:5) for a step, H.264, no audio track, `-movflags +faststart`,
  under 600 KB. Overviews: 20 to 30 s with sound and `controls`, under 4 MB, never autoplaying with
  sound. GitHub Pages doesn't serve Git LFS, so commit videos plainly and keep them small.
- **Dark-mode captures.** In dark mode the page is dark but the app captures are light. When dark
  captures exist, add a `<picture>` with a `(prefers-color-scheme: dark)` source for each.
- **Headline font.** Headlines use the system serif (New York on Apple devices, Georgia elsewhere),
  so the site loads no web fonts. To use Fraunces as the design review suggests, add a self-hosted
  woff2 in `fonts/` and an `@font-face` named "Fraunces" at the top of `style.css`; the font stack
  already lists it first.
- **Official App Store badge.** Buttons say "Download on the App Store" in the site's teal. Apple's
  badge artwork comes from Apple's Marketing Tools; to use it, add the SVG to `images/` and swap it
  into the buttons.

## Publishing

Copy the contents of this folder (without `_design/` if you like; it's working material) into the
public site repo and push. Check after the first deploy that Safari plays the tab card's sound
(GitHub Pages serves `.m4a` as `audio/mp4`).
