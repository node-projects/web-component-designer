import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium, firefox } from 'playwright';
import { fileURLToPath } from 'node:url';

let bundle;
const browsers = [];
before(async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const result = await build({
    absWorkingDir: root,
    stdin: { contents: `
      import * as core from './src/index.ts';
      import { CssParserStylesheetService } from '../web-component-designer-stylesheetservice-css-parser/src/service/stylesheetservice/CssParserStylesheetService.ts';
      window.fixture = { core, CssParserStylesheetService };
    `, resolveDir: root },
    alias: { '@node-projects/web-component-designer': root + '/src/index.ts' },
    bundle: true, write: false, format: 'iife', platform: 'browser',
  });
  bundle = result.outputFiles[0].text;
  browsers.push(await chromium.launch());
  browsers.push(await firefox.launch({ firefoxUserPrefs: { 'layout.css.getBoxQuads.enabled': true } }));
});
after(async () => { await Promise.all(browsers.map(browser => browser.close())); });

for (const [browserIndex, name] of ['Chromium polyfill', 'Firefox native'].entries()) {
  for (const zoom of [0.5, 1, 2]) {
    test(`${name}: root style edits keep selection and pointer coordinates aligned at zoom ${zoom}`, async () => {
      const page = await browsers[browserIndex].newPage({ viewport: { width: 1200, height: 900 } });
      try {
        await page.setContent('<!doctype html><body style="margin:0"></body>');
        await page.addScriptTag({ content: bundle });
        await page.evaluate(async zoom => {
          const { core, CssParserStylesheetService } = window.fixture;
          const services = core.createDefaultServiceContainer();
          services.registerDocumentService('stylesheetService', container => new CssParserStylesheetService(container));
          const doc = new core.EditingDocument(services);
          await doc.loadHtml('<div style="padding:14px"><div id="target" style="width:150px;height:60px;background:lightgreen"></div></div>');
          const styles = doc.instanceServiceContainer.stylesheetService;
          await styles.setStylesheets([{ name: 'test', content: 'body { margin: 24px; }' }]);
          const view = new core.DesignerView();
          view.style.cssText = 'position:fixed;left:40px;top:30px;width:900px;height:700px';
          document.body.appendChild(view);
          await view.attachDocument(doc);
          const canvas = view.designerCanvas;
          canvas.setViewport(zoom, { x: 7, y: 11 });
          const target = doc.rootDesignItem.querySelectorAll('#target')[0];
          doc.instanceServiceContainer.selectionService.setSelectedElements([core.DesignItem.GetDesignItem(target)]);
          window.currentFixture = { doc, view, canvas, target, styles };
        }, zoom);

        for (const content of [
          'body { margin: 24px; }',
          ':root { margin: 24px; }',
          ':host { margin: 36px 48px; }',
          ':host { margin: -12px 18px; padding: 6px; }',
          ':host { margin: 0; }',
        ]) {
          const result = await page.evaluate(async content => {
            const { canvas, target, styles } = window.currentFixture;
            await styles.updateCompleteStylesheet('test', content);
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            canvas.extensionManager.refreshAllAppliedExtentions();
            const rect = target.getBoundingClientRect();
            const lines = [...canvas.overlayLayer.shadowRoot.querySelectorAll('.svg-selection')];
            const bounds = lines.map(line => line.getBoundingClientRect());
            const overlay = {
              left: Math.min(...bounds.map(r => r.left)), top: Math.min(...bounds.map(r => r.top)),
              right: Math.max(...bounds.map(r => r.right)), bottom: Math.max(...bounds.map(r => r.bottom)),
            };
            const quad = target.getBoxQuads({ relativeTo: canvas.canvas })[0];
            const pointer = canvas.getNormalizedEventCoordinates({ clientX: rect.x, clientY: rect.y });
            const normalized = canvas.getNormalizedElementCoordinates(target);
            return { rect: rect.toJSON(), overlay, pointer, normalized, quad: { x: quad.p1.x, y: quad.p1.y } };
          }, content);
          for (const edge of ['left', 'top', 'right', 'bottom'])
            assert.ok(Math.abs(result.overlay[edge] - result.rect[edge]) <= 1, `${content}: ${edge} ${JSON.stringify(result)}`);
          for (const axis of ['x', 'y']) {
            assert.ok(Math.abs(result.pointer[axis] - result.quad[axis]) <= 1, `${content}: pointer ${axis}`);
            assert.ok(Math.abs(result.normalized[axis] - result.quad[axis]) <= 1, `${content}: element ${axis}`);
          }
        }
      } finally {
        await page.close();
      }
    });
  }
}
