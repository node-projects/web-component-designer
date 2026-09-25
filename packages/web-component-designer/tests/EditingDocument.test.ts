/** @jest-environment jsdom */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';

// jsdom lacks layout and constructable stylesheets; model and lifecycle code stay real.
Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
CSSStyleSheet.prototype.replaceSync = function () { };
Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
Object.defineProperty(globalThis, 'ResizeObserver', { value: class { observe() { } disconnect() { } unobserve() { } } });
Object.defineProperty(globalThis, 'DOMRect', { value: class { constructor(public x = 0, public y = 0, public width = 0, public height = 0) { } } });

for (const name of ['SVGPathElement', 'SVGRectElement', 'SVGCircleElement', 'SVGEllipseElement', 'SVGLineElement', 'SVGPolylineElement', 'SVGPolygonElement', 'SVGForeignObjectElement'])
  (globalThis as any)[name] = class extends SVGElement { };

(globalThis as any).MathMLElement ??= class extends Element { };

let EditingDocument: typeof import('../src/elements/EditingDocument').EditingDocument;
let ServiceContainer: typeof import('../src/elements/services/ServiceContainer').ServiceContainer;
let DesignerView: typeof import('../src/elements/widgets/designerView/designerView').DesignerView;
let DocumentContainer: typeof import('../src/elements/documentContainer').DocumentContainer;
let DesignItem: typeof import('../src/elements/item/DesignItem').DesignItem;
let DefaultHtmlParserService: typeof import('../src/elements/services/htmlParserService/DefaultHtmlParserService').DefaultHtmlParserService;
let HtmlWriterService: typeof import('../src/elements/services/htmlWriterService/HtmlWriterService').HtmlWriterService;
let DesignItemService: typeof import('../src/elements/services/designItemService/DesignItemService').DesignItemService;
let UndoService: typeof import('../src/elements/services/undoService/UndoService').UndoService;

beforeAll(async () => {
  ({ EditingDocument } = await import('../src/elements/EditingDocument'));
  ({ ServiceContainer } = await import('../src/elements/services/ServiceContainer'));
  ({ DesignerView } = await import('../src/elements/widgets/designerView/designerView'));
  ({ DocumentContainer } = await import('../src/elements/documentContainer'));
  ({ DesignItem } = await import('../src/elements/item/DesignItem'));
  ({ DefaultHtmlParserService } = await import('../src/elements/services/htmlParserService/DefaultHtmlParserService'));
  ({ HtmlWriterService } = await import('../src/elements/services/htmlWriterService/HtmlWriterService'));
  ({ DesignItemService } = await import('../src/elements/services/designItemService/DesignItemService'));
  ({ UndoService } = await import('../src/elements/services/undoService/UndoService'));
});

function services() {
  const services = new ServiceContainer();
  services.register('designItemService', new DesignItemService());
  services.register('htmlParserService', new DefaultHtmlParserService());
  services.register('htmlWriterService', new HtmlWriterService());
  services.config.demoViewWidget = null;
  return services;
}

afterEach(() => { document.body.replaceChildren(); jest.useRealTimers(); });

test('loads, queries, edits and writes with no designer; emits transactions during detached undo/redo', async () => {
  const doc = new EditingDocument(services());
  await doc.loadHtml('<input id="one" value="old"><span>text</span>');
  expect(doc.rootDesignItem.isRootItem).toBe(true);
  expect(doc.instanceServiceContainer.designerCanvas).toBeUndefined();
  const item = DesignItem.GetDesignItem(doc.rootDesignItem.querySelectorAll('#one')[0]);
  const content = jest.fn();
  const transactions = jest.fn();
  doc.instanceServiceContainer.onContentChanged.on(content);
  doc.instanceServiceContainer.undoService.onTransaction.on(transactions);
  item.setAttribute('data-page', 'closed');
  item.setProperty('value', 'new');
  expect((item.element as HTMLInputElement).value).toBe('new');
  const undo = doc.instanceServiceContainer.undoService;
  undo.undo();
  expect((item.element as HTMLInputElement).value).toBe('old');
  undo.undo();
  expect(item.hasAttribute('data-page')).toBe(false);
  undo.redo();
  undo.redo();
  expect(await doc.serialize()).toContain('data-page="closed"');
  expect(transactions).toHaveBeenCalledTimes(6);
  expect(content).toHaveBeenCalledTimes(6);
  await doc.dispose();
});

test('preserves identity, DOM and history through visible editing and repeated attachment', async () => {
  const doc = new EditingDocument(services());
  await doc.loadHtml('<div id="one"></div>');
  const item = doc.rootDesignItem.firstChild;
  const root = doc.rootDesignItem;
  const node = item.node;
  item.setAttribute('title', 'detached');
  const view = new DesignerView();
  document.body.appendChild(view);
  for (let i = 0; i < 3; i++) {
    await view.attachDocument(doc);
    expect(view.designerCanvas.rootDesignItem).toBe(root);
    expect(root.firstChild).toBe(item);
    expect(item.node).toBe(node);
    expect(node.isConnected).toBe(true);
    item.setAttribute('title', 'visible');
    expect(view.detachDocument()).toBe(doc);
    expect(node.isConnected).toBe(false);
    doc.instanceServiceContainer.undoService.undo();
    expect(item.getAttribute('title')).toBe('detached');
    doc.instanceServiceContainer.undoService.redo();
    expect(item.getAttribute('title')).toBe('visible');
    doc.instanceServiceContainer.undoService.undo();
  }
  await view.attachDocument(doc);
  expect(root.firstChild).toBe(item);
  expect(doc.instanceServiceContainer.undoService.undoCount).toBe(1);
  view.dispose();
  await doc.dispose();
});

test('code edits commit before programmatic access and empty replacements can be undone', async () => {
  const doc = new EditingDocument(services());
  await doc.loadHtml('<div id="before"></div>');
  const original = doc.rootDesignItem.firstChild;
  const container = new DocumentContainer(doc.serviceContainer, doc);
  document.body.appendChild(container);
  await container.whenReady();
  container.currentView = 'code';
  const input = container.codeView.shadowRoot.querySelector('textarea');
  input.value = '<section id="after"></section>';
  input.dispatchEvent(new Event('input'));
  await doc.commitPendingChanges();
  expect(doc.rootDesignItem.firstChild.name).toBe('section');
  doc.rootDesignItem.firstChild.setAttribute('title', 'synced');
  expect(await doc.serialize()).toContain('title="synced"');
  input.value = '';
  input.dispatchEvent(new Event('input'));
  expect(await doc.serialize()).toBe('');
  doc.instanceServiceContainer.undoService.undo();
  expect(doc.rootDesignItem.firstChild.name).toBe('section');
  doc.instanceServiceContainer.undoService.undo();
  doc.instanceServiceContainer.undoService.undo();
  expect(doc.rootDesignItem.firstChild).toBe(original);
  await container.dispose();
  expect(doc.isDisposed).toBe(false);
  await doc.dispose();
});

test('failed code commits preserve valid items, history and pending text and can be retried', async () => {
  const service = services();
  const doc = new EditingDocument(service);
  await doc.loadHtml('<div></div>');
  const item = doc.rootDesignItem.firstChild;
  item.setAttribute('title', 'keep');
  const parser = service.htmlParserService;
  const parse = jest.spyOn(parser, 'parse').mockRejectedValueOnce(new Error('invalid source'));
  const error = jest.fn();
  doc.onCommitError.on(error);
  doc.setPendingHtml('<section>pending</section>');
  await expect(doc.serialize()).rejects.toThrow('invalid source');
  expect(doc.hasPendingChanges).toBe(true);
  expect(doc.rootDesignItem.firstChild).toBe(item);
  expect(doc.instanceServiceContainer.undoService.undoCount).toBe(1);
  expect(error).toHaveBeenCalledTimes(1);
  parse.mockRestore();
  expect(await doc.serialize()).toContain('<section>pending</section>');
  doc.instanceServiceContainer.undoService.undo();
  expect(doc.rootDesignItem.firstChild).toBe(item);
  await doc.dispose();
});

test('standalone construction loads before connection and retains normal undo behavior', async () => {
  const container = new DocumentContainer(services(), '<div title="initial"></div>');
  await container.whenReady();
  const item = container.instanceServiceContainer.rootDesignItem.firstChild;
  expect(item.getAttribute('title')).toBe('initial');
  document.body.appendChild(container);
  await container.setContentAsync('<span>next</span>');
  container.instanceServiceContainer.undoService.undo();
  expect(container.instanceServiceContainer.rootDesignItem.firstChild).toBe(item);
  await container.dispose();
});

test('custom document undo factory survives attachment and is disposed exactly once', async () => {
  const service = services();
  const dispose = jest.fn();
  service.registerDocumentService('undoService', container => Object.assign(new UndoService(container), { dispose }));
  const doc = new EditingDocument(service);
  await doc.loadHtml('<div></div>');
  const undo = doc.instanceServiceContainer.undoService;
  const view = new DesignerView();
  await view.attachDocument(doc);
  view.detachDocument();
  await view.attachDocument(doc);
  expect(doc.instanceServiceContainer.undoService).toBe(undo);
  await doc.dispose();
  await doc.dispose();
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(view.editingDocument).toBeUndefined();
  expect(() => doc.setPendingHtml('')).toThrow('disposed');
  view.dispose();
});

test('custom elements initialize detached and reconnect without replacing their DesignItems', async () => {
  let constructed = 0, connected = 0, disconnected = 0;
  class DocumentTestElement extends HTMLElement {
    constructor() { super(); constructed++; }
    connectedCallback() { connected++; }
    disconnectedCallback() { disconnected++; }
  }
  customElements.define('document-test-element', DocumentTestElement);
  const service = services();
  const initialize = jest.fn();
  service.register('intializationService', { init: initialize });
  const doc = new EditingDocument(service);
  await doc.loadHtml('<document-test-element data-value="a"></document-test-element>');
  const item = doc.rootDesignItem.firstChild;
  expect(item.node).toBeInstanceOf(DocumentTestElement);
  expect(constructed).toBe(1);
  expect(connected).toBe(0);
  expect(initialize).toHaveBeenCalledTimes(1);
  const view = new DesignerView();
  document.body.appendChild(view);
  await view.attachDocument(doc);
  expect(connected).toBe(1);
  view.detachDocument();
  expect(disconnected).toBe(1);
  await view.attachDocument(doc);
  expect(connected).toBe(2);
  expect(constructed).toBe(1);
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(doc.rootDesignItem.firstChild).toBe(item);
  view.dispose();
  await doc.dispose();
});

test('an in-flight commit also commits newer code text, without frame delays', async () => {
  const service = services();
  const doc = new EditingDocument(service);
  await doc.loadHtml('<div></div>');
  const parser = service.htmlParserService;
  const originalParse = parser.parse.bind(parser);
  let release: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let started: () => void;
  const start = new Promise<void>(resolve => { started = resolve; });
  jest.spyOn(parser, 'parse').mockImplementationOnce(async (...args) => {
    started();
    await gate;
    return originalParse(...args);
  });
  doc.setPendingHtml('<section>first</section>');
  const commit = doc.commitPendingChanges();
  await start;
  doc.setPendingHtml('<article>latest</article>');
  release();
  await commit;
  expect(doc.hasPendingChanges).toBe(false);
  expect(doc.rootDesignItem.firstChild.name).toBe('article');
  expect(await doc.serialize()).toContain('latest');
  await doc.dispose();
});

test('rejects a second editable view and keeps the original attachment intact', async () => {
  const doc = new EditingDocument(services());
  const first = new DesignerView();
  const second = new DesignerView();
  await first.attachDocument(doc);
  await expect(second.attachDocument(doc)).rejects.toThrow('already has an attached view');
  expect(doc.instanceServiceContainer.designerCanvas).toBe(first.designerCanvas);
  first.dispose();
  second.dispose();
  await doc.dispose();
});

test('repeated attachment disposes subscriptions, observers and refresh timers', async () => {
  jest.useFakeTimers();
  const doc = new EditingDocument(services());
  await doc.loadHtml('<div></div>');
  const view = new DesignerView();
  document.body.appendChild(view);
  const events = [doc.instanceServiceContainer.onContentChanged, doc.instanceServiceContainer.selectionService.onSelectionChanged,
    doc.instanceServiceContainer.selectionService.onSelectionRefresh, doc.serviceContainer.globalContext.onToolChanged];
  const counts = () => events.map(event => (event as any).listeners.length);
  const baseline = counts();
  for (let i = 0; i < 4; i++) {
    await view.attachDocument(doc);
    const observer = (view.designerCanvas as any)._resizeObserver;
    const disconnect = jest.spyOn(observer, 'disconnect');
    view.detachDocument();
    expect(disconnect).toHaveBeenCalled();
    disconnect.mockRestore();
    expect(counts()).toEqual(baseline);
  }
  await doc.dispose();
  view.dispose();
  jest.runAllTicks(); // Flush base custom-element initialization microtasks.
  expect(jest.getTimerCount()).toBe(0);
});

test('legacy canvas undo factories still work in standalone editors and require migration for detached creation', async () => {
  const service = services();
  service.register('undoService', canvas => new UndoService(canvas));
  expect(() => new EditingDocument(service)).toThrow("registerDocumentService('undoService'");
  const view = new DesignerView();
  view.initialize(service);
  await view.parseDesignerHTML('<div></div>', true);
  view.editingDocument.rootDesignItem.firstChild.setAttribute('title', 'legacy');
  expect(view.instanceServiceContainer.undoService.canUndo()).toBe(true);
  const doc = view.detachDocument();
  view.dispose();
  await doc.dispose();
});

test('the node HTML parser uses the document DOM while detached', async () => {
  const { newElementFromString } = await import('../src/elements/helper/ElementHelper');
  const { CssAttributeParser } = await import('../src/elements/helper/CssAttributeParser');
  const { DomConverter } = await import('../src/elements/widgets/designerView/DomConverter');
  const { InstanceServiceContainer } = await import('../src/elements/services/InstanceServiceContainer');
  const { AbstractStylesheetService } = await import('../src/elements/services/stylesheetService/AbstractStylesheetService');
  const collaborationIndexes = await import('../src/elements/services/collaborationService/CollaborationNodeIndex');
  const { CommandType } = await import('../src/commandHandling/CommandType');
  jest.unstable_mockModule('@node-projects/web-component-designer', () => ({
    DesignItem, newElementFromString, CssAttributeParser, DomConverter, InstanceServiceContainer, AbstractStylesheetService, CommandType, ...collaborationIndexes
  }));
  const { NodeHtmlParserService } = await import('../../web-component-designer-htmlparserservice-nodehtmlparser/src/service/htmlParserService/NodeHtmlParserService');
  const service = services();
  // The package types resolve to dist; the mock above deliberately supplies the source classes.
  service.register('htmlParserService', new NodeHtmlParserService() as unknown as import('../src/elements/services/htmlParserService/IHtmlParserService').IHtmlParserService);
  const doc = new EditingDocument(service);
  await doc.loadHtml('<!--page--><div id="node-parser" style="color: red">text</div>');
  const item = DesignItem.GetDesignItem(doc.rootDesignItem.querySelectorAll('#node-parser')[0]);
  item.setAttribute('title', 'detached');
  expect(item.document).toBe(doc.rootDesignItem.document);
  expect(await doc.serialize()).toContain('title="detached"');
  doc.instanceServiceContainer.undoService.undo();
  expect(item.hasAttribute('title')).toBe(false);
  await doc.dispose();
});

test('closing and reopening document containers preserves history without retaining view listeners', async () => {
  const doc = new EditingDocument(services());
  await doc.loadHtml('<div></div>');
  const item = doc.rootDesignItem.firstChild;
  const initialListeners = (doc.instanceServiceContainer.onContentChanged as any).listeners.length;
  for (let i = 0; i < 3; i++) {
    const editor = new DocumentContainer(doc.serviceContainer, doc);
    document.body.appendChild(editor);
    await editor.whenReady();
    item.setAttribute('title', String(i));
    expect(editor.instanceServiceContainer.rootDesignItem.firstChild).toBe(item);
    await editor.dispose();
    editor.remove();
    expect((doc.instanceServiceContainer.onContentChanged as any).listeners.length).toBe(initialListeners);
  }
  expect(doc.instanceServiceContainer.undoService.undoCount).toBe(3);
  doc.instanceServiceContainer.undoService.undo();
  expect(item.getAttribute('title')).toBe('1');
  await doc.dispose();
});

test('a failed initial load can be corrected and pending code is never discarded on close', async () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => { });
  const service = services();
  const parser = service.htmlParserService;
  const parse = jest.spyOn(parser, 'parse').mockRejectedValueOnce(new Error('initial failure'));
  const editor = new DocumentContainer(service, '<div>bad</div>');
  await expect(editor.whenReady()).rejects.toThrow('initial failure');
  parse.mockRestore();
  await editor.setContentAsync('<div>fixed</div>');
  const doc = editor.editingDocument;
  expect(await doc.serialize()).toContain('fixed');
  jest.spyOn(parser, 'parse').mockRejectedValue(new Error('pending failure'));
  doc.setPendingHtml('<unfinished>');
  await expect(editor.dispose()).rejects.toThrow('pending failure');
  expect(doc.pendingHtml).toBe('<unfinished>');
  expect(editor.editingDocument).toBe(doc);
  jest.restoreAllMocks();
  doc.setPendingHtml('<div>corrected</div>');
  await editor.dispose();
  expect(doc.isDisposed).toBe(true);
  errors.mockRestore();
});

test('default bootstrap supports detached editing and clears config subscriptions on final disposal', async () => {
  const { createDefaultServiceContainer } = await import('../src/elements/services/DefaultServiceBootstrap');
  const service = createDefaultServiceContainer();
  const doc = new EditingDocument(service);
  await doc.loadHtml('<div id="configured"></div><style>div { color: red }</style>');
  const item = [...doc.rootDesignItem.allMatching('#configured')][0];
  item.setAttribute('title', 'configured');
  expect(await doc.serialize()).toContain('title="configured"');
  const view = new DesignerView();
  await view.attachDocument(doc);
  await doc.dispose();
  expect((doc.instanceServiceContainer.designContext.extensionOptionsChanged as any).listeners).toHaveLength(0);
  expect((service.globalContext.onToolChanged as any).listeners).toHaveLength(0);
  view.dispose();
});


test('CSS parser package supports detached rules and stylesheet undo', async () => {
  const { CssParserStylesheetService } = await import('../../web-component-designer-stylesheetservice-css-parser/src/service/stylesheetservice/CssParserStylesheetService');
  const service = services();
  service.registerDocumentService('stylesheetService', container => new CssParserStylesheetService(container as any) as any);
  const doc = new EditingDocument(service);
  await doc.loadHtml('<style>.page { color: red; }</style><div class="page"></div>');
  const styles = doc.instanceServiceContainer.stylesheetService;
  expect(styles.getDeclarations([...doc.rootDesignItem.children()].at(-1), 'color')[0].value).toBe('red');
  await styles.setStylesheets([{ name: 'external.css', content: '.page { color: blue; }' }]);
  await styles.updateCompleteStylesheet('external.css', '.page { color: green; }');
  expect(styles.getStylesheets()[0].content).toContain('green');
  doc.instanceServiceContainer.undoService.undo();
  // Undo uses the stylesheet service's asynchronous parser.
  await Promise.resolve();
  expect(styles.getStylesheets()[0].content).toContain('blue');
  doc.instanceServiceContainer.undoService.redo();
  await Promise.resolve();
  expect(styles.getStylesheets()[0].content).toContain('green');
  await doc.dispose();
});

test('collaboration package retains document events but releases view listeners on every detach and disposal', async () => {
  const { DefaultCollaborationService } = await import('../../web-component-designer-collaboration-service/src/services/DefaultCollaborationService');
  const service = services();
  service.registerDocumentService('collaborationService', container => new DefaultCollaborationService(container as any) as any);
  const doc = new EditingDocument(service);
  await doc.loadHtml('<div id="one"></div>');
  const container = doc.instanceServiceContainer;
  const collaboration = container.collaborationService;
  const changes = jest.fn();
  collaboration.onChange.on(changes);
  doc.rootDesignItem.firstChild.setAttribute('title', 'detached');
  expect(changes).toHaveBeenCalledTimes(1);
  expect(collaboration.createSnapshot().html).toContain('title="detached"');
  const view = new DesignerView();
  document.body.appendChild(view);
  const overlay = view.designerCanvas.clickOverlay;
  const add = jest.spyOn(overlay, 'addEventListener');
  const remove = jest.spyOn(overlay, 'removeEventListener');
  for (let i = 0; i < 3; i++) {
    await view.attachDocument(doc);
    view.detachDocument();
  }
  const pointerListeners = calls => calls.filter(([name]) => name === 'pointermove' || name === 'pointerleave');
  expect(pointerListeners(add.mock.calls)).toHaveLength(6);
  expect(pointerListeners(remove.mock.calls)).toHaveLength(6);
  container.undoService.undo();
  expect(changes).toHaveBeenCalledTimes(2);
  expect(collaboration.createSnapshot().html).not.toContain('title=');
  await collaboration.applyRemoteSnapshot({ html: '<span id="remote"></span>', stylesheets: [], updatedAt: Date.now() });
  expect(doc.rootDesignItem.firstChild.name).toBe('span');
  view.dispose();
  await doc.dispose();
  expect((container.onDesignerCanvasChanged as any).listeners).toHaveLength(0);
  expect((container.undoService.onTransaction as any).listeners).toHaveLength(0);
  expect((container.selectionService.onSelectionChanged as any).listeners).toHaveLength(0);
});


test('Monaco retains source before initialization and closing a hidden view cancels initialization resources', async () => {
  const { CodeViewMonaco } = await import('../../web-component-designer-codeview-monaco/src/widgets/codeView/code-view-monaco');
  let resolveLibrary: (value: any) => void;
  const library = new Promise<any>(resolve => { resolveLibrary = resolve; });
  const getLibrary = jest.spyOn(CodeViewMonaco, 'getMonacoLib').mockReturnValue(library);
  const observe = jest.spyOn(ResizeObserver.prototype, 'observe');
  const disconnect = jest.spyOn(ResizeObserver.prototype, 'disconnect');
  const create = jest.fn();
  try {
    const closing = new CodeViewMonaco();
    closing.update('<div>pending</div>');
    expect(closing.getText()).toBe('<div>pending</div>');
    expect(closing.code).toBe('<div>pending</div>');
    await Promise.resolve(); // BaseCustomWebComponent initializes its template in a microtask.
    closing.dispose();
    resolveLibrary({ editor: { create } });
    await library;
    expect(observe).not.toHaveBeenCalled();
    const hidden = new CodeViewMonaco();
    await Promise.resolve();
    await Promise.resolve();
    expect(observe).toHaveBeenCalledTimes(1);
    hidden.dispose();
    hidden.dispose();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  } finally {
    getLibrary.mockRestore();
    observe.mockRestore();
    disconnect.mockRestore();
  }
});
