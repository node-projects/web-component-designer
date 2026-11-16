import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

test('large canvases keep cursor updates independent of document size and retain selection/comment overlays', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const result = await build({
    absWorkingDir: root,
    stdin: { contents: `
      import * as core from './src/index.ts';
      import { setupCollaborationService } from '../web-component-designer-collaboration-service/src/setupCollaborationService.ts';
      import { applyCollaborationHtml } from '../web-component-designer-collaboration-service/src/applyCollaborationHtml.ts';
      window.fixture = { core, setupCollaborationService, applyCollaborationHtml };
    `, resolveDir: root },
    alias: { '@node-projects/web-component-designer': root + '/src/index.ts' },
    bundle: true, write: false, format: 'iife', platform: 'browser',
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<!doctype html><body style="margin:0"></body>');
    await page.addScriptTag({ content: result.outputFiles[0].text });
    const observed = await page.evaluate(async () => {
      const { core, setupCollaborationService, applyCollaborationHtml } = window.fixture;
      const services = core.createDefaultServiceContainer();
      setupCollaborationService(services);
      const doc = new core.EditingDocument(services);
      await doc.loadHtml(Array.from({ length: 2000 }, (_, index) =>
        `<div id="item-${index}" style="position:absolute;left:${index % 20 * 40}px;top:${Math.floor(index / 20) * 20}px;width:35px;height:15px"></div>`).join(''));
      const view = new core.DesignerView();
      view.style.cssText = 'display:block;position:relative;width:1100px;height:800px';
      document.body.append(view); await view.attachDocument(doc);
      const canvas = view.designerCanvas;
      const collaboration = doc.instanceServiceContainer.collaborationService;
      collaboration.connect('test', 'local', 'Local');
      const frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
      collaboration.updatePeerPresence({ peerId: 'remote', displayName: 'Remote', selectedNodeIndexes: [100], activeNodeIndex: 100,
        cursorPosition: { x: 10, y: 10 } }, 'remote');
      await frame();
      const root = doc.rootDesignItem;
      const children = root.children.bind(root);
      let visited = 0;
      root.children = function* (...args) { for (const item of children(...args)) { visited++; yield item; } };
      for (let index = 0; index < 5; index++) {
        collaboration.updatePeerPresence({ peerId: 'remote', cursorPosition: { x: index * 10, y: 20 } }, 'remote');
        await frame();
      }
      const cursorWork = visited;
      const target = [...root.children()].find(item => item.id === 'item-101');
      doc.instanceServiceContainer.selectionService.setSelectedElements([target]);
      const parse = services.htmlParserService.parse.bind(services.htmlParserService);
      const parsed = [];
      services.htmlParserService.parse = (html, ...args) => { parsed.push(html.length); return parse(html, ...args); };
      const beforeHtml = doc.getHtml();
      const stableHtml = doc.getHtml();
      target.setStyle('width', '71px');
      const resizedHtml = doc.getHtml();
      const repeatedHtml = doc.getHtml();
      target.setStyle('width', '35px');
      const restoredHtml = doc.getHtml();
      const styleCache = { stable: beforeHtml === stableHtml, changed: resizedHtml !== beforeHtml,
        repeat: resizedHtml === repeatedHtml, restored: beforeHtml === restoredHtml };
      const tag = beforeHtml.match(/<div\b[^>]*id="item-101"[^>]*>/)[0];
      const updatedTag = tag.replace('id="item-101"', 'id="item-101" data-note="Remote > value"')
        .replace(/style="([^"]*)"/, (_, css) => `style="${css};color:red !important"`);
      const getHtml = doc.getHtml.bind(doc);
      doc.getHtml = () => { throw new Error('A supplied current snapshot must avoid whole-document serialization'); };
      try { await applyCollaborationHtml(doc, beforeHtml.replace(tag, updatedTag), undefined, beforeHtml); }
      finally { doc.getHtml = getHtml; }
      const propertyUpdate = { parsed: [...parsed], retained: doc.instanceServiceContainer.selectionService.primarySelection === target,
        note: target.getAttribute('data-note'), color: target.getStyle('color'), important: target.isStyleImportant('color') };
      const other = [...root.children()].find(item => item.id === 'item-102');
      let raced = false;
      services.htmlParserService.parse = async (html, ...args) => {
        const items = await parse(html, ...args);
        if (!raced) { raced = true; other.setAttribute('data-local', 'Retained during parsing'); }
        return items;
      };
      await applyCollaborationHtml(doc, doc.getHtml().replace('data-note="Remote &gt; value"', 'data-note="Remote update"')
        .replace('data-note="Remote > value"', 'data-note="Remote update"'));
      const concurrent = { remote: target.getAttribute('data-note'), local: other.getAttribute('data-local') };
      services.htmlParserService.parse = parse;
      const before = canvas.overlayLayer.shadowRoot.querySelectorAll('.svg-collaboration-peer').length;
      collaboration.upsertComment({ id: 'comment', text: 'Check this item', authorPeerId: 'remote', targetNodeIndex: 500,
        createdAt: Date.now(), updatedAt: Date.now() }, 'remote');
      await frame();
      const comments = canvas.overlayLayer.shadowRoot.querySelectorAll('.svg-collaboration-comment').length;
      collaboration.updateRemoteSelection('remote', [101], 101); await frame();
      const selected = canvas.overlayLayer.shadowRoot.querySelectorAll('.svg-collaboration-peer').length;
      collaboration.removePeer('remote', 'remote'); collaboration.removeComment('comment', 'remote'); await frame();
      const remaining = canvas.overlayLayer.shadowRoot.querySelectorAll('[class^="svg-collaboration-"]').length;
      const edge = new core.EditingDocument(services);
      await edge.loadHtml('<section><script type="text/plain"><div id="real" title="old"></script><div id="real" title="actual"></div></section>');
      const commentBefore = edge.getHtml();
      await applyCollaborationHtml(edge, edge.getHtml().replace('title="old"', 'title="new"'));
      const commentDetails = { before: commentBefore, after: edge.getHtml(), title: [...edge.rootDesignItem.children(true)].find(item => item.nodeType === core.NodeType.Element && item.id === 'real').getAttribute('title') };
      const commentSafe = commentDetails.title === 'actual' && commentDetails.after.includes('title="new"');
      await edge.loadHtml('<div id="duplicate" title="first"></div><div id="duplicate" title="second"></div>');
      await applyCollaborationHtml(edge, edge.getHtml().replace('title="first"', 'title="updated"'));
      const duplicateTitles = [...edge.rootDesignItem.children()].filter(item => item.nodeType === core.NodeType.Element).map(item => item.getAttribute('title'));
      await edge.loadHtml('<div title="without-id"></div><div title="second"></div>');
      const anonymousTarget = edge.rootDesignItem.firstChild;
      await applyCollaborationHtml(edge, edge.getHtml().replace('title="without-id"', 'title="position update"'));
      const positional = anonymousTarget === edge.rootDesignItem.firstChild && anonymousTarget.getAttribute('title') === 'position update';
      await edge.loadHtml('<svg><rect x="1" y="2" width="10" height="10"></rect></svg>');
      const rect = edge.rootDesignItem.firstChild.firstChild;
      await applyCollaborationHtml(edge, edge.getHtml().replace('x="1"', 'x="3"'));
      const svg = rect === edge.rootDesignItem.firstChild.firstChild && rect.getAttribute('x') === '3'
        && rect.element.namespaceURI === 'http://www.w3.org/2000/svg';
      await edge.dispose();
      view.dispose(); await doc.dispose();
      return { cursorWork, before, comments, selected, remaining, propertyUpdate, styleCache, concurrent, commentSafe, commentDetails, duplicateTitles, positional, svg };
    });
    assert.ok(observed.cursorWork < 100, `Pointer-only updates traversed the drawing: ${observed.cursorWork} items`);
    assert.equal(observed.before, 1);
    assert.equal(observed.comments, 1);
    assert.equal(observed.selected, 1);
    assert.equal(observed.remaining, 0);
    assert.equal(observed.propertyUpdate.retained, true);
    assert.equal(observed.propertyUpdate.note, 'Remote > value');
    assert.equal(observed.propertyUpdate.color, 'red');
    assert.equal(observed.propertyUpdate.important, true);
    assert.equal(observed.propertyUpdate.parsed.length, 1);
    assert.ok(observed.propertyUpdate.parsed[0] < 300, 'A property update must not parse the whole drawing');
    assert.deepEqual(observed.styleCache, { stable: true, changed: true, repeat: true, restored: true });
    assert.deepEqual(observed.concurrent, { remote: 'Remote update', local: 'Retained during parsing' });
    assert.equal(observed.commentSafe, true, JSON.stringify(observed.commentDetails));
    assert.deepEqual(observed.duplicateTitles, ['updated', 'second']);
    assert.equal(observed.positional, true);
    assert.equal(observed.svg, true);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
