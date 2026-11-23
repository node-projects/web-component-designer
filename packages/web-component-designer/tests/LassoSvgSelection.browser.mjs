import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

let browser, bundle;
before(async () => {
  const result = await build({
    absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
    stdin: { contents: `
      import { DesignerView } from './src/elements/widgets/designerView/designerView.ts';
      import { createDefaultServiceContainer } from './src/elements/services/DefaultServiceBootstrap.ts';
      import { NamedTools } from './src/elements/widgets/designerView/tools/NamedTools.ts';
      window.createDesigner = async (zoom, transformed) => {
        const services = createDefaultServiceContainer();
        services.options.svgEditingMode = 'content';
        const view = new DesignerView();
        view.style.cssText = 'display:block;width:1000px;height:700px';
        document.body.append(view); view.initialize(services);
        await view.designerCanvas.whenReady();
        await view.parseDesignerHTML('<div id="ordinary" style="position:absolute;left:500px;top:80px;width:60px;height:60px;background:ivory"></div>' +
          '<svg style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs><path id="definition" d="M120 240H320V140"></path></defs>' +
          '<g transform="' + (transformed ? 'translate(20 10) rotate(15 200 200)' : '') + '"><path id="fence" d="M120 240H320V140" fill="none" stroke="green" stroke-width="4"></path></g></svg>');
        window.canvas = view.designerCanvas;
        canvas.setViewport(zoom, {x: 0, y: 0});
        window.startLasso = () => canvas.executeCommand({type: 'setTool', parameter: NamedTools.MagicWandSelector});
      };
    `, resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
    bundle: true, write: false, format: 'iife', platform: 'browser',
  });
  bundle = result.outputFiles[0].text;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); });

async function setup(t, zoom = 1, transformed = false) {
  const page = await browser.newPage();
  t.after(() => page.close());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.setContent('<body style="margin:0"></body>');
  await page.addScriptTag({ content: bundle });
  await page.evaluate(({ zoom, transformed }) => window.createDesigner(zoom, transformed), { zoom, transformed });
  return page;
}

async function lasso(page, points, modifier) {
  await page.evaluate(() => window.startLasso());
  if (modifier) await page.keyboard.down(modifier);
  await page.mouse.move(points[0].x, points[0].y); await page.mouse.down();
  for (const p of points.slice(1)) await page.mouse.move(p.x, p.y, { steps: 4 });
  await page.mouse.up();
  if (modifier) await page.keyboard.up(modifier);
  return page.evaluate(() => canvas.instanceServiceContainer.selectionService.selectedElements.filter(item => !item.isRootItem).map(item => item.id));
}

async function fencePoints(page, partial = false) {
  return page.evaluate(partial => {
    const matrix = canvas.rootDesignItem.querySelectorAll('#fence')[0].getScreenCTM();
    const points = partial ? [[295, 120], [345, 120], [345, 265], [295, 265]]
      : [[100, 220], [295, 220], [295, 120], [345, 120], [345, 265], [100, 265]];
    return points.map(([x, y]) => { const p = new DOMPoint(x, y).matrixTransform(matrix); return { x: p.x, y: p.y }; });
  }, partial);
}

test('a concave lasso selects an enclosed L-shaped path without its empty bounding-box corner', async t => {
  for (const zoom of [0.75, 1.6]) for (const transformed of [false, true]) {
    const page = await setup(t, zoom, transformed);
    assert.deepEqual(await lasso(page, await fencePoints(page)), ['fence']);
  }
});

test('a lasso enclosing only one leg does not select the complete path', async t => {
  const page = await setup(t, 1.3, true);
  assert.deepEqual(await lasso(page, await fencePoints(page, true)), []);
});

test('additive and subtractive lasso selection retain unrelated objects', async t => {
  const page = await setup(t);
  assert.deepEqual(await lasso(page, await fencePoints(page)), ['fence']);
  const ordinary = await page.evaluate(() => {
    const b = canvas.rootDesignItem.querySelectorAll('#ordinary')[0].getBoundingClientRect();
    return [{x:b.left-10,y:b.top-10},{x:b.right+10,y:b.top-10},{x:b.right+10,y:b.bottom+10},{x:b.left-10,y:b.bottom+10}];
  });
  assert.deepEqual(await lasso(page, ordinary, 'Alt'), ['fence']);
  assert.deepEqual(await lasso(page, ordinary, process.platform === 'darwin' ? 'Meta' : 'Control'), ['fence', 'ordinary']);
  assert.deepEqual(await lasso(page, ordinary, 'Alt'), ['fence']);
});
