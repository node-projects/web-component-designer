import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

test('hidden property grids retain the latest selection and content without rebuilding until shown', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const bundle = await build({ absWorkingDir: root,
    stdin: { contents: `import * as core from './src/index.ts'; window.core = core;`, resolveDir: root },
    bundle: true, write: false, format: 'iife', platform: 'browser' });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><body></body>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const result = await page.evaluate(async () => {
      const { core } = window;
      const services = core.createDefaultServiceContainer(), calls = [];
      services.register('propertyGroupsService', { getPropertygroups(items) { calls.push(items?.[0]?.id); return []; } });
      const doc = new core.EditingDocument(services);
      await doc.loadHtml('<div id="first"></div><div id="last"></div>');
      const host = document.createElement('div'); host.style.cssText = 'display:none;width:300px;height:400px'; document.body.append(host);
      const grid = new core.PropertyGrid(); host.append(grid); grid.serviceContainer = services;
      grid.instanceServiceContainer = doc.instanceServiceContainer;
      const first = doc.rootDesignItem.firstChild, last = [...doc.rootDesignItem.children()][1];
      const frames = async () => { for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame); };
      doc.instanceServiceContainer.selectionService.setSelectedElements([first]);
      doc.instanceServiceContainer.selectionService.setSelectedElements([last]);
      last.setAttribute('title', 'Latest content');
      await frames(); const hiddenCalls = calls.length;
      host.style.display = 'block'; await frames();
      const shown = [...calls]; calls.length = 0;
      host.style.display = 'none'; await frames();
      doc.instanceServiceContainer.selectionService.setSelectedElements([first]); await frames();
      const hiddenAgain = calls.length;
      host.style.display = 'block'; await frames();
      const reopened = [...calls]; host.remove(); await doc.dispose();
      return { hiddenCalls, hiddenAgain, shown, reopened };
    });
    assert.equal(result.hiddenCalls, 0);
    assert.equal(result.hiddenAgain, 0);
    assert.deepEqual(result.shown, ['last']);
    assert.deepEqual(result.reopened, ['first']);
  } finally { await browser.close(); }
});
