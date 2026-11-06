import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

let browser;
let bundle;
before(async () => {
  const result = await build({
    absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
    stdin: { contents: `
      import { DesignerView } from './src/elements/widgets/designerView/designerView.ts';
      import { createDefaultServiceContainer } from './src/elements/services/DefaultServiceBootstrap.ts';
      window.createDesigner = async () => {
        const view = new DesignerView();
        view.style.cssText = 'display:block;width:1000px;height:700px';
        document.body.append(view);
        view.initialize(createDefaultServiceContainer());
        await view.designerCanvas.whenReady();
        view.designerWidth = '16000px';
        view.designerHeight = '12000px';
        await view.parseDesignerHTML('<div id="marker" style="position:absolute;left:300px;top:200px;width:30px;height:30px"></div>');
        view.designerCanvas.setViewport(1.82, {x: 0, y: 0});
        window.view = view;
        window.canvas = view.designerCanvas;
      };
    `, resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
    bundle: true, write: false, format: 'iife', platform: 'browser',
  });
  bundle = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); });

async function setup(t, reducedMotion = 'reduce') {
  const page = await browser.newPage({ reducedMotion });
  t.after(() => page.close());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => window.createDesigner());
  return page;
}

test('wheel movement follows screen pixels at any page size or zoom, including fractional diagonal input', async t => {
  const page = await setup(t);
  const results = await page.evaluate(async () => {
    const results = [];
    for (const [size, zoom] of [[16000, 1.82], [4000, 0.5], [24000, 4]]) {
      view.designerWidth = size + 'px';
      canvas.setViewport(zoom, { x: -200, y: -300 });
      const marker = canvas.rootDesignItem.querySelectorAll('#marker')[0];
      const before = marker.getBoundingClientRect();
      view.dispatchEvent(new WheelEvent('wheel', { deltaX: 12.5, deltaY: 42.25, cancelable: true }));
      await new Promise(requestAnimationFrame);
      const after = marker.getBoundingClientRect();
      results.push({ x: before.x - after.x, y: before.y - after.y });
    }
    return results;
  });
  for (const movement of results) {
    assert.ok(Math.abs(movement.x - 12.5) < 0.05);
    assert.ok(Math.abs(movement.y - 42.25) < 0.05);
  }
});

test('line/page units and Shift scrolling respect viewport distances and horizontal touchpad input', async t => {
  const page = await setup(t);
  const result = await page.evaluate(async () => {
    async function move(init) {
      const before = canvas.canvasOffsetUnzoomed;
      view.dispatchEvent(new WheelEvent('wheel', { ...init, cancelable: true }));
      await new Promise(requestAnimationFrame);
      return { x: before.x - canvas.canvasOffsetUnzoomed.x, y: before.y - canvas.canvasOffsetUnzoomed.y };
    }
    return {
      line: await move({ deltaY: 3, deltaMode: 1 }),
      page: await move({ deltaY: 1, deltaMode: 2 }),
      viewport: canvas.clientHeight,
      shift: await move({ deltaY: 50, shiftKey: true }),
      horizontal: await move({ deltaX: 25, shiftKey: true })
    };
  });
  assert.ok(result.line.y > 3 && result.line.y < 100);
  assert.ok(Math.abs(result.page.y - result.viewport) < 0.01);
  assert.ok(Math.abs(result.shift.x - 50) < 0.01 && result.shift.y === 0);
  assert.ok(Math.abs(result.horizontal.x - 25) < 0.01 && result.horizontal.y === 0);
});

test('tiny pinch deltas apply on the next frame without a tail and keep the point under the pointer fixed', async t => {
  const page = await setup(t, 'no-preference');
  const result = await page.evaluate(async () => {
    const marker = canvas.rootDesignItem.querySelectorAll('#marker')[0];
    const before = marker.getBoundingClientRect();
    const startZoom = canvas.zoomFactor;
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, ctrlKey: true, clientX: before.x, clientY: before.y, cancelable: true }));
    const samples = [];
    for (let i = 0; i < 30; i++) {
      await new Promise(requestAnimationFrame);
      const rect = marker.getBoundingClientRect();
      samples.push({ zoom: canvas.zoomFactor, drift: Math.hypot(rect.x - before.x, rect.y - before.y) });
    }
    return { startZoom, samples };
  });
  assert.ok(result.samples[0].zoom > result.startZoom);
  assert.equal(result.samples[0].zoom, result.samples.at(-1).zoom);
  assert.ok(result.samples.at(-1).zoom / result.startZoom < 1.02);
  assert.ok(result.samples.every(sample => sample.drift < 0.1));
});

test('toolbar zoom stays proportional at overview and detail scales and opposite clicks restore the viewport', async t => {
  const page = await setup(t);
  const results = await page.evaluate(() => {
    const results = [];
    for (const zoom of [0.03, 1.82, 8]) {
      canvas.setViewport(zoom, { x: -200, y: -300 });
      const initial = { ...canvas.canvasOffset };
      view.shadowRoot.querySelector('#zoomIncrease').click();
      const increased = canvas.zoomFactor;
      const centerBefore = { x: canvas.clientWidth / zoom / 2 - initial.x, y: canvas.clientHeight / zoom / 2 - initial.y };
      const centerAfter = { x: canvas.clientWidth / increased / 2 - canvas.canvasOffset.x, y: canvas.clientHeight / increased / 2 - canvas.canvasOffset.y };
      view.shadowRoot.querySelector('#zoomDecrease').click();
      results.push({ ratio: increased / zoom, restoredZoom: canvas.zoomFactor / zoom,
        centerDrift: Math.hypot(centerAfter.x - centerBefore.x, centerAfter.y - centerBefore.y),
        offsetDrift: Math.hypot(canvas.canvasOffset.x - initial.x, canvas.canvasOffset.y - initial.y) });
    }
    return results;
  });
  for (const result of results) {
    assert.ok(result.ratio > 1.1 && result.ratio < 1.5);
    assert.ok(Math.abs(result.ratio - results[0].ratio) < 1e-10);
    assert.ok(Math.abs(result.restoredZoom - 1) < 1e-10);
    assert.ok(result.centerDrift < 0.01);
    assert.ok(result.offsetDrift < 0.01);
  }
});

test('a sustained pinch reaches the same relative zoom at different starting scales without lagging behind input', async t => {
  const page = await setup(t, 'no-preference');
  const results = await page.evaluate(async () => {
    const results = [];
    for (const zoom of [0.5, 1.82, 4]) {
      canvas.setViewport(zoom, { x: -200, y: -300 });
      for (let i = 0; i < 12; i++) {
        view.dispatchEvent(new WheelEvent('wheel', { deltaY: -2, ctrlKey: true, clientX: 400, clientY: 300, cancelable: true }));
        await new Promise(requestAnimationFrame);
      }
      const atRelease = canvas.zoomFactor;
      for (let i = 0; i < 20; i++) await new Promise(requestAnimationFrame);
      results.push({ ratio: canvas.zoomFactor / zoom, atRelease: (atRelease - zoom) / (canvas.zoomFactor - zoom) });
    }
    return results;
  });
  for (const result of results) {
    assert.ok(result.ratio > 1.2 && result.ratio < 1.4);
    assert.ok(Math.abs(result.ratio - results[0].ratio) < 0.0001);
    assert.ok(result.atRelease > 0.9);
  }
});

test('holding a zoom button progresses in fine proportional steps and stops on release', async t => {
  const page = await setup(t);
  await page.locator('#zoomIncrease').click({ delay: 800 });
  const released = await page.evaluate(() => canvas.zoomFactor);
  const later = await page.evaluate(async () => {
    for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
    return canvas.zoomFactor;
  });
  assert.ok(released / 1.82 > 1.3 && released / 1.82 < 4);
  assert.equal(later, released);
});

test('browser-generated touchpad pinch follows the native scale at high zoom and far from the origin', async t => {
  const page = await setup(t, 'no-preference');
  const input = await page.context().newCDPSession(page);
  const results = [];
  for (const zoom of [1.82, 8, 20]) {
    const point = await page.evaluate(zoom => {
      const marker = canvas.rootDesignItem.querySelectorAll('#marker')[0];
      marker.style.left = '8000px';
      marker.style.top = '6000px';
      marker.style.overflowY = 'auto';
      marker.innerHTML = '<div style="height:1000px">Scrollable shape</div>';
      canvas.setViewport(zoom, { x: 400 / zoom - 8000, y: 300 / zoom - 6000 });
      const bounds = marker.getBoundingClientRect();
      const point = { x: Math.round(bounds.x + 10), y: Math.round(bounds.y + 10) };
      window.pinchEvents = [];
      window.pinchSamples = [];
      window.pinchSubscription?.dispose();
      window.pinchSubscription = canvas.onZoomFactorChanged.on(() => {
        const current = marker.getBoundingClientRect();
        const scale = canvas.zoomFactor / zoom;
        pinchSamples.push({ zoom: canvas.zoomFactor, drift: Math.hypot(
          current.x + (point.x - bounds.x) * scale - point.x,
          current.y + (point.y - bounds.y) * scale - point.y) });
      });
      if (!window.pinchRecorder) {
        window.pinchRecorder = event => pinchEvents.push({ trusted: event.isTrusted, ctrl: event.ctrlKey, dy: event.deltaY, mode: event.deltaMode });
        view.addEventListener('wheel', pinchRecorder, { capture: true });
      }
      return point;
    }, zoom);
    await input.send('Input.synthesizePinchGesture', { ...point, scaleFactor: 1.2, relativeSpeed: 400, gestureSourceType: 'mouse' });
    const result = await page.evaluate(async zoom => {
      const atEnd = canvas.zoomFactor;
      for (let i = 0; i < 20; i++) await new Promise(requestAnimationFrame);
      return { ratio: canvas.zoomFactor / zoom, tail: Math.abs(canvas.zoomFactor - atEnd) / zoom, events: pinchEvents, samples: pinchSamples };
    }, zoom);
    results.push({ zoom, ...result });
    t.diagnostic(JSON.stringify({ zoom, ratio: result.ratio, tail: result.tail, maxDrift: Math.max(...result.samples.map(sample => sample.drift)), events: result.events.length }));
  }
  for (const result of results) {
    assert.ok(result.events.length > 0 && result.events.every(event => event.trusted && event.ctrl && event.mode === 0));
    assert.ok(Math.abs(result.ratio - 1.2) < 0.01, `Native 1.2x pinch became ${result.ratio}x at zoom ${result.zoom}`);
    assert.ok(result.samples.every(sample => sample.drift < 0.2));
    assert.ok(result.tail < 0.001, 'Pinch must not keep moving after the native gesture ends');
  }
});

test('reversing a pinch at high zoom reverses the next frame instead of continuing toward an old target', async t => {
  const page = await setup(t, 'no-preference');
  const result = await page.evaluate(async () => {
    canvas.setViewport(20, { x: -7980, y: -5985 });
    const wheel = deltaY => view.dispatchEvent(new WheelEvent('wheel', {
      deltaY, ctrlKey: true, clientX: 430, clientY: 300, cancelable: true
    }));
    wheel(-3);
    await new Promise(requestAnimationFrame);
    const beforeReverse = canvas.zoomFactor;
    wheel(0.5);
    await new Promise(requestAnimationFrame);
    return { beforeReverse, afterReverse: canvas.zoomFactor };
  });
  assert.ok(result.afterReverse < result.beforeReverse,
    `Reversing the pinch still zoomed in: ${result.beforeReverse} -> ${result.afterReverse}`);
});

test('coarse modified-wheel events cannot turn one tick into a large high-zoom jump', async t => {
  const page = await setup(t, 'no-preference');
  const result = await page.evaluate(async () => {
    canvas.setViewport(20, { x: -7980, y: -5985 });
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, ctrlKey: true, clientX: 430, clientY: 300, cancelable: true }));
    await new Promise(requestAnimationFrame);
    return canvas.zoomFactor / 20;
  });
  assert.ok(result > 1 && result < 1.3);
});

test('starting a high-zoom pinch during an unfinished scroll keeps the painted anchor in place', async t => {
  const page = await setup(t, 'no-preference');
  const result = await page.evaluate(async () => {
    canvas.setViewport(20, { x: -7980, y: -5985 });
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true }));
    await new Promise(requestAnimationFrame);
    const rect = canvas.getBoundingClientRect();
    const point = { x: 400, y: 300 };
    const local = { x: point.x / canvas.zoomFactor - canvas.canvasOffset.x, y: point.y / canvas.zoomFactor - canvas.canvasOffset.y };
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, ctrlKey: true, clientX: rect.x + point.x, clientY: rect.y + point.y, cancelable: true }));
    await new Promise(requestAnimationFrame);
    return Math.hypot((local.x + canvas.canvasOffset.x) * canvas.zoomFactor - point.x,
      (local.y + canvas.canvasOffset.y) * canvas.zoomFactor - point.y);
  });
  assert.ok(result < 0.01, `Starting the pinch jumped ${result}px toward the pending scroll target`);
});

test('wheel easing accumulates input and stops when direct navigation takes over', async t => {
  const page = await setup(t, 'no-preference');
  const result = await page.evaluate(async () => {
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true }));
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true }));
    await new Promise(requestAnimationFrame);
    const first = -canvas.canvasOffsetUnzoomed.y;
    for (let i = 0; i < 30; i++) await new Promise(requestAnimationFrame);
    const final = -canvas.canvasOffsetUnzoomed.y;
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true }));
    canvas.canvasOffset = { x: 10, y: 20 };
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    const offset = { ...canvas.canvasOffset };
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true }));
    view.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    const afterPointer = { ...canvas.canvasOffset };
    view.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true }));
    const document = view.detachDocument();
    await view.attachDocument(document);
    const attached = { ...canvas.canvasOffset };
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    return { first, final, offset, afterPointer, attached, afterAttach: canvas.canvasOffset };
  });
  assert.ok(result.first > 0 && result.first < 240);
  assert.ok(Math.abs(result.final - 240) < 0.01);
  assert.deepEqual(result.offset, { x: 10, y: 20 });
  assert.deepEqual(result.afterPointer, result.offset);
  assert.deepEqual(result.afterAttach, result.attached);
});

test('scrollbar arrows use screen steps, track clicks use a viewport, and thumb size follows zoom', async t => {
  const page = await setup(t);
  const result = await page.evaluate(() => {
    const vertical = view.shadowRoot.querySelector('#s-vert');
    const initialThumb = vertical.thumbSize;
    vertical.dispatchEvent(new CustomEvent('scrollbar-input', { detail: 'incrementSmall' }));
    const small = -canvas.canvasOffsetUnzoomed.y;
    const unchangedX = canvas.canvasOffset.x;
    vertical.dispatchEvent(new CustomEvent('scrollbar-input', { detail: 'incrementLarge' }));
    const large = -canvas.canvasOffsetUnzoomed.y - small;
    canvas.zoomFactor *= 2;
    return { small, large, viewport: canvas.clientHeight, initialThumb, zoomedThumb: vertical.thumbSize, unchangedX };
  });
  assert.ok(Math.abs(result.small - 40) < 0.01);
  assert.ok(Math.abs(result.large / result.viewport - 0.9) < 0.01);
  assert.ok(result.zoomedThumb < result.initialThumb);
  assert.equal(result.unchangedX, 0);
});
