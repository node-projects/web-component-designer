import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

let browser;
let helperBundle;

before(async () => {
  const result = await build({
    absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
    stdin: { contents: `
      import { createOverlayPathDataFromSvgGeometryElement } from './src/elements/helper/SvgHelper.ts';
      import { addPolyfill } from './src/elements/helper/getBoxQuads.js';
      addPolyfill();
      window.createOutline = createOverlayPathDataFromSvgGeometryElement;
    `, resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
    bundle: true, write: false, format: 'iife', platform: 'browser',
  });
  helperBundle = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
});

after(async () => { await browser?.close(); });

test('path conversion reuses geometry reads within a path and refreshes them after a transform edit', async () => {
  const page = await browser.newPage();
  try {
    await page.setContent('<div id="canvas"><svg width="500" height="300"><path id="path" d="M0 0L100 100"/></svg></div>');
    await page.addScriptTag({ content: helperBundle });
    const result = await page.evaluate(() => {
      const canvas = document.getElementById('canvas'), path = document.getElementById('path');
      const getBBox = path.getBBox.bind(path), getScreenCTM = path.getScreenCTM.bind(path);
      let boxes = 0, transforms = 0;
      path.getBBox = (...args) => { boxes++; return getBBox(...args); };
      path.getScreenCTM = () => { transforms++; return getScreenCTM(); };
      const convert = () => {
        boxes = transforms = 0;
        const outline = window.createOutline(path, { canvas, iframes: [] }, { includeMarkers: false });
        return { boxes, transforms, outline };
      };
      const short = convert();
      path.setAttribute('d', 'M0 0' + Array.from({ length: 128 }, (_, i) => `L${(i + 1) * 100 / 128} ${i % 2 ? 0 : 100}`).join(''));
      const long = convert();
      path.setAttribute('transform', 'translate(30 40)');
      const moved = convert();
      return { short, long, moved };
    });
    assert.ok(result.short.boxes > 0);
    assert.equal(result.long.boxes, result.short.boxes);
    assert.equal(result.long.transforms, result.short.transforms);
    assert.notEqual(result.long.outline, result.moved.outline);
  } finally { await page.close(); }
});

for (const zoom of [0.5, 1, 2]) {
  for (const transform of ['', 'translate(160 120)', 'translate(250 120) rotate(35)', 'translate(220 100) rotate(-20) scale(1.4 .7)']) {
    test(`marker hover tip follows its shaft at zoom ${zoom} with ${transform || 'no ancestor transform'}`, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(`<div id="canvas" style="position:absolute;left:20px;top:30px;width:1000px;height:700px;transform-origin:0 0;transform:scale(${zoom})">
          <svg style="width:100%;height:100%"><defs>
            <marker id="tip" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0L10 5L0 10Z"/>
            </marker>
          </defs><g transform="${transform}"><line id="shaft" transform="translate(7 -9)" x1="20" y1="30" x2="180" y2="130" stroke="black" stroke-width="4" marker-end="url(#tip)"/></g></svg>
        </div>`);
        await page.addScriptTag({ content: helperBundle });
        const result = await page.evaluate(zoom => {
          const canvas = document.getElementById('canvas');
          const line = document.getElementById('shaft');
          const context = { canvas, iframes: [] };
          const shaft = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          shaft.setAttribute('d', window.createOutline(line, context, { includeMarkers: false }));
          const outline = shaft.cloneNode();
          outline.setAttribute('d', window.createOutline(line, context));
          const marker = outline.getPathData({ normalize: true }).slice(shaft.getPathData({ normalize: true }).length);
          const tip = new DOMPoint(180, 130).matrixTransform(line.getScreenCTM());
          const bounds = canvas.getBoundingClientRect();
          const expected = { x: (tip.x - bounds.left) / zoom, y: (tip.y - bounds.top) / zoom };
          const distance = Math.min(...marker.filter(segment => segment.type === 'M' || segment.type === 'L')
            .map(segment => Math.hypot(segment.values[0] - expected.x, segment.values[1] - expected.y)));
          return { distance, temporaryGroups: line.ownerSVGElement.querySelectorAll('g[visibility="hidden"]').length };
        }, zoom);
        assert.ok(result.distance < 0.01, `Marker tip is ${result.distance}px away from the shaft endpoint`);
        assert.equal(result.temporaryGroups, 0);
      } finally {
        await page.close();
      }
    });
  }
}
