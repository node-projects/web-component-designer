import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

test('hidden numeric editors do not poll frames and resize correctly after showing or reconnecting', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const bundle = await build({
    absWorkingDir: root,
    stdin: { contents: `import { NumericStyleInput } from './src/elements/controls/NumericStyleInput.ts'; window.NumericStyleInput = NumericStyleInput;`, resolveDir: root },
    bundle: true, write: false, format: 'iife', platform: 'browser',
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><body></body>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const result = await page.evaluate(async () => {
      const nativeFrame = window.requestAnimationFrame.bind(window);
      let scheduledFrames = 0;
      window.requestAnimationFrame = callback => { scheduledFrames++; return nativeFrame(callback); };
      const frames = async () => { for (let n = 0; n < 8; n++) await new Promise(nativeFrame); };
      const host = document.createElement('div'); host.style.display = 'none'; document.body.append(host);
      const editors = Array.from({ length: 24 }, () => {
        const editor = new window.NumericStyleInput();
        editor.units = ['px', '%']; editor.fixedValues = ['auto']; editor.value = '10px'; host.append(editor);
        return editor;
      });
      await frames();
      for (const editor of editors) editor.value = '20%';
      await frames();
      const hiddenFrames = scheduledFrames;
      host.style.display = 'block'; await frames();
      const editor = editors[0], select = editor.shadowRoot.querySelector('#select');
      const small = select.getBoundingClientRect().width;
      editor.style.fontSize = '32px'; editor.value = 'auto'; await frames();
      const large = select.getBoundingClientRect().width;
      host.remove(); for (const item of editors) item.value = '30px'; await frames();
      const removedFrames = scheduledFrames;
      document.body.append(host); await frames();
      return { hiddenFrames, removedFrames, totalFrames: scheduledFrames, small, large,
        reconnectedWidth: select.getBoundingClientRect().width, value: editor.value, option: select.value };
    });
    assert.equal(result.hiddenFrames, 0);
    assert.equal(result.removedFrames, 0);
    assert.equal(result.totalFrames, 0);
    assert.ok(result.small > 17);
    assert.ok(result.large > result.small);
    assert.ok(result.reconnectedWidth > 17);
    assert.equal(result.value, '30px');
    assert.equal(result.option, 'px');
  } finally { await browser.close(); }
});
