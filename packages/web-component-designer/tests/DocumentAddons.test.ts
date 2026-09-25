/** @jest-environment jsdom */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';

Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
CSSStyleSheet.prototype.replaceSync = function () { };
Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
Object.defineProperty(globalThis, 'ResizeObserver', { value: class { observe() { } disconnect() { } unobserve() { } } });
for (const name of ['SVGPathElement', 'SVGRectElement', 'SVGCircleElement', 'SVGEllipseElement', 'SVGLineElement', 'SVGPolylineElement', 'SVGPolygonElement', 'SVGForeignObjectElement'])
  (globalThis as any)[name] = class extends SVGElement { };
(globalThis as any).MathMLElement ??= class extends Element { };

let core: typeof import('../src/index');
beforeAll(async () => {
  core = await import('../src/index');
  jest.unstable_mockModule('@node-projects/web-component-designer', () => core);
});
afterEach(() => { document.body.replaceChildren(); jest.useRealTimers(); jest.restoreAllMocks(); });

function services() {
  const service = new core.ServiceContainer();
  service.register('designItemService', new core.DesignItemService());
  service.register('htmlParserService', new core.DefaultHtmlParserService());
  service.register('htmlWriterService', new core.HtmlWriterService());
  service.config.demoViewWidget = null;
  return service;
}

// Replace only the third-party editor engine; the code view and document are real.
function editorEngine(initial: string) {
  let value = initial;
  const handlers = new Set<() => void>();
  return {
    on: (_event, handler) => handlers.add(handler),
    off: (_event, handler) => handlers.delete(handler),
    getValue: () => value,
    setValue: (text: string) => { value = text; for (const handler of handlers) handler(); },
    clearSelection() { }, setSize() { },
    destroy: jest.fn(), toTextArea: jest.fn(),
    renderer: { attachToShadowRoot() { } },
    handlers
  };
}

test('Ace preserves pre-ready source, reports edits immediately, and releases its observer on close', async () => {
  let engine: ReturnType<typeof editorEngine>;
  const edit = jest.fn((host: HTMLElement, options: { value: string }) => {
    host.innerHTML = '<div class="ace_content"></div>';
    return engine = editorEngine(options.value);
  });
  (globalThis as any).ace = { edit, require: () => ({ addCompleter() { } }) };
  const { CodeViewAce } = await import('../../web-component-designer-codeview-ace/src/widgets/codeView/code-view-ace');
  const disconnected = jest.spyOn(MutationObserver.prototype, 'disconnect');
  const doc = new core.EditingDocument(services());
  await doc.loadHtml('<div>old</div>');
  const view = new CodeViewAce();
  view.update('<div>old</div>');
  expect(view.getText()).toBe('<div>old</div>');
  view.onTextChanged.on(text => doc.setPendingHtml(text));
  await Promise.resolve();
  expect(engine.getValue()).toBe('<div>old</div>');
  engine.setValue('<button>Ace edit</button>');
  expect(await doc.serialize()).toContain('Ace edit');
  view.dispose();
  view.dispose();
  expect(disconnected).toHaveBeenCalledTimes(1);
  expect(engine.destroy).toHaveBeenCalledTimes(1);
  const closing = new CodeViewAce();
  closing.dispose();
  await Promise.resolve();
  expect(edit).toHaveBeenCalledTimes(1);
  await doc.dispose();
  delete (globalThis as any).ace;
});

test('CodeMirror 5 preserves pre-ready source, commits edits and tears down its editor exactly once', async () => {
  let engine: ReturnType<typeof editorEngine>;
  const fromTextArea = jest.fn((textarea: HTMLTextAreaElement) => engine = editorEngine(textarea.value));
  jest.unstable_mockModule('codemirror5', () => ({ default: { fromTextArea } }));
  jest.unstable_mockModule('codemirror5/lib/codemirror.css', () => ({ default: '' }));
  jest.unstable_mockModule('codemirror5/addon/fold/foldgutter.css', () => ({ default: '' }));
  const { CodeViewCodeMirror5 } = await import('../../web-component-designer-codeview-codemirror5/src/widgets/codeView/code-view-codemirror5');
  const doc = new core.EditingDocument(services());
  await doc.loadHtml('<div>old</div>');
  const view = new CodeViewCodeMirror5();
  view.update('<div>old</div>');
  expect(view.getText()).toBe('<div>old</div>');
  view.onTextChanged.on(text => doc.setPendingHtml(text));
  await Promise.resolve();
  expect(engine.getValue()).toBe('<div>old</div>');
  engine.setValue('<button>CodeMirror edit</button>');
  expect(await doc.serialize()).toContain('CodeMirror edit');
  view.dispose();
  view.dispose();
  expect(engine.handlers.size).toBe(0);
  expect(engine.toTextArea).toHaveBeenCalledTimes(1);
  const closing = new CodeViewCodeMirror5();
  closing.dispose();
  await Promise.resolve();
  expect(fromTextArea).toHaveBeenCalledTimes(1);
  await doc.dispose();
});

test('Mermaid palette switches subscriptions without retaining earlier documents', async () => {
  const { LazyLoader } = await import('@node-projects/base-custom-webcomponent');
  jest.spyOn(LazyLoader, 'LoadText').mockResolvedValue('{"elements":["div"]}');
  const { MermaidElementsService } = await import('../../web-component-designer-mermaid/src/services/MermaidElementsService');
  const palette = new MermaidElementsService('test', '/unused.json');
  const first = new core.EditingDocument(services());
  const second = new core.EditingDocument(services());
  const listeners = doc => (doc.instanceServiceContainer.onContentChanged as any).listeners.length;
  const initial = listeners(first);
  const binding1 = palette.setInstanceServiceContainer(first.instanceServiceContainer as any);
  expect(listeners(first)).toBe(initial + 1);
  const binding2 = palette.setInstanceServiceContainer(second.instanceServiceContainer as any);
  expect(listeners(first)).toBe(initial);
  binding1.dispose(); // A stale view must not clear a newer binding.
  expect(listeners(second)).toBe(initial + 1);
  binding2.dispose();
  expect(listeners(second)).toBe(initial);
  palette.dispose();
  await first.dispose();
  await second.dispose();
});

test('BaseCustomWebcomponent parser awaits stylesheets and preserves pending invalid source', async () => {
  (globalThis as any).ts = await import('typescript');
  const { BaseCustomWebcomponentParserService } = await import('../../web-component-designer-htmlparserservice-base-custom-webcomponent/src/service/htmlParserService/BaseCustomWebcomponentParserService');
  const { CssParserStylesheetService } = await import('../../web-component-designer-stylesheetservice-css-parser/src/service/stylesheetservice/CssParserStylesheetService');
  const service = services();
  service.registerDocumentService('stylesheetService', container => new CssParserStylesheetService(container as any) as any);
  service.register('htmlParserService', new BaseCustomWebcomponentParserService(new core.DefaultHtmlParserService() as any) as any);
  const doc = new core.EditingDocument(service);
  const source = 'class Test { static template = html`<button>ready</button>`; static style = css`button { color: red; }`; }';
  let release: () => void;
  const styles = doc.instanceServiceContainer.stylesheetService;
  const original = styles.setStylesheets.bind(styles);
  let styleStarted: () => void;
  const started = new Promise<void>(resolve => { styleStarted = resolve; });
  jest.spyOn(styles, 'setStylesheets').mockImplementation(async value => {
    styleStarted();
    await new Promise<void>(resolve => { release = resolve; });
    await original(value);
  });
  let loaded = false;
  const loading = doc.loadHtml(source).then(() => { loaded = true; });
  await started;
  expect(loaded).toBe(false);
  release();
  await loading;
  expect(styles.getStylesheets()[0].content).toContain('color: red');
  const item = doc.rootDesignItem.firstChild;
  doc.setPendingHtml('class Test { static template = html`unterminated');
  await expect(doc.commitPendingChanges()).rejects.toThrow(SyntaxError);
  expect(doc.rootDesignItem.firstChild).toBe(item);
  expect(doc.hasPendingChanges).toBe(true);
  (styles.setStylesheets as any).mockRestore();
  doc.setPendingHtml(source);
  await doc.dispose();
  delete (globalThis as any).ts;
});

test('Wunderbaum can inspect a detached document and releases document bindings and queued work', async () => {
  let tree: any;
  class TreeEngine {
    nodes: any[] = [];
    root = {
      removeChildren: () => { this.nodes = []; },
      addChildren: data => {
        const add = entry => {
          const row = document.createElement('div');
          const element = document.createElement('span');
          element.innerHTML = '<span class="wb-title"></span>';
          row.appendChild(element);
          const node = {
            data: { ref: entry.ref }, title: entry.title, element,
            selected: false, isActive: () => false, setSelected() { }, setActive() { }, setFocus() { },
            getColElem: () => element,
            scrollIntoView: jest.fn()
          };
          this.nodes.push(node);
          this.options.render({ node, nodeElem: element, isNew: true });
          entry.children?.forEach(add);
        };
        add(data);
      },
      visit: fn => this.nodes.forEach(fn)
    };
    constructor(public options: any) { tree = this; }
    visit(fn) { this.nodes.forEach(fn); }
    runWithDeferredUpdate(fn) { fn(); }
    async expandAll() { }
    clearFilter() { }
    destroy = jest.fn();
  }
  jest.unstable_mockModule('wunderbaum', () => ({ Wunderbaum: TreeEngine }));
  jest.unstable_mockModule('wunderbaum/dist/wunderbaum.css', () => ({ default: '' }));
  const { TreeViewExtended } = await import('../../web-component-designer-widgets-wunderbaum/src/widgets/treeView/treeViewExtended');
  const first = new core.EditingDocument(services());
  const second = new core.EditingDocument(services());
  await first.loadHtml('<div id="first"></div>');
  await second.loadHtml('<div id="second"></div>');
  const initialContentListeners = (first.instanceServiceContainer.onContentChanged as any).listeners.length;
  jest.useFakeTimers();
  const view = new TreeViewExtended();
  view.instanceServiceContainer = first.instanceServiceContainer as any;
  await jest.advanceTimersByTimeAsync(25);
  const row = tree.nodes.find(node => node.data.ref.id === 'first');
  expect(row).toBeDefined();
  expect(() => row.element.onmouseenter(new MouseEvent('mouseenter'))).not.toThrow();
  expect(() => row.element.onmouseleave(new MouseEvent('mouseleave'))).not.toThrow();
  expect(view.showDesignItemContextMenu(first.rootDesignItem.firstChild as any, new MouseEvent('contextmenu'))).toBeNull();
  expect(first.rootDesignItem.firstChild[Symbol.for('wunderbaumnode')]).toBeUndefined();
  view.createTree(first.rootDesignItem as any); // Queued work must not restore the old document.
  view.instanceServiceContainer = second.instanceServiceContainer as any;
  await jest.advanceTimersByTimeAsync(25);
  expect(tree.nodes.some(node => node.data.ref.id === 'first')).toBe(false);
  expect(tree.nodes.some(node => node.data.ref.id === 'second')).toBe(true);
  expect((first.instanceServiceContainer.onContentChanged as any).listeners.length).toBe(initialContentListeners);
  view.createTree(second.rootDesignItem as any);
  view.dispose();
  view.dispose();
  await jest.advanceTimersByTimeAsync(25);
  expect(tree.destroy).toHaveBeenCalledTimes(1);
  expect(tree.nodes).toHaveLength(0);
  expect((second.instanceServiceContainer.onContentChanged as any).listeners.length).toBe(initialContentListeners);
  expect(jest.getTimerCount()).toBe(0);
  await first.dispose();
  await second.dispose();
});

test('visualization event assignment detaches its selection subscription and item references', async () => {
  // Script dialogs are outside this test; the actual document binding stays real.
  jest.unstable_mockModule('../../web-component-designer-visualization-addons/src/blockly/BlocklyScriptEditor', () => ({ BlocklyScriptEditor: class {} }));
  jest.unstable_mockModule('../../web-component-designer-visualization-addons/src/components/SimpleScriptEditor', () => ({ SimpleScriptEditor: class {} }));
  const { EventAssignment } = await import('../../web-component-designer-visualization-addons/src/components/EventAssignment');
  const service = services();
  service.register('eventsService', { isHandledElementFromEventsService: () => true, getPossibleEvents: () => [] } as any);
  const first = new core.EditingDocument(service);
  const second = new core.EditingDocument(service);
  await first.loadHtml('<div></div>');
  await second.loadHtml('<span></span>');
  const view = new EventAssignment();
  const count = doc => (doc.instanceServiceContainer.selectionService.onSelectionChanged as any).listeners.length;
  const initial = count(first);
  view.instanceServiceContainer = first.instanceServiceContainer as any;
  first.instanceServiceContainer.selectionService.setSelectedElements([first.rootDesignItem.firstChild]);
  expect(view.selectedItems[0]).toBe(first.rootDesignItem.firstChild);
  view.instanceServiceContainer = second.instanceServiceContainer as any;
  expect(count(first)).toBe(initial);
  view.dispose();
  expect(count(second)).toBe(initial);
  expect(view.selectedItems).toHaveLength(0);
  expect(view.events).toHaveLength(0);
  await first.dispose();
  await second.dispose();
});

test('Mermaid setup keeps the palette on the attached document and restores canvas hooks on detach', async () => {
  const { LazyLoader } = await import('@node-projects/base-custom-webcomponent');
  jest.spyOn(LazyLoader, 'LoadText').mockResolvedValue(JSON.stringify({ elements: [
    { tag: 'flow-node', diagramTypes: ['flowchart'] },
    { tag: 'sequence-node', diagramTypes: ['sequenceDiagram'] }
  ] }));
  const { createMermaidDesignerServiceContainer } = await import('../../web-component-designer-mermaid/src/setupMermaidServiceContainer');
  const service = createMermaidDesignerServiceContainer();
  const first = new core.EditingDocument(service as any);
  await first.loadHtml('flowchart TD\nA[First]');
  const item = first.rootDesignItem.firstChild;
  const palette = service.getLastService('elementsService');
  const view = new core.DesignerView();
  const original = view.designerCanvas.raiseDesignItemsChanged;
  await view.attachDocument(first);
  expect(view.designerCanvas.raiseDesignItemsChanged).not.toBe(original);
  const second = new core.EditingDocument(service as any);
  await second.loadHtml('sequenceDiagram\nparticipant A');
  expect((await palette.getElements()).map(x => x.tag)).toEqual(['flow-node']);
  view.detachDocument();
  expect(view.designerCanvas.raiseDesignItemsChanged).toBe(original);
  await view.attachDocument(second);
  expect((await palette.getElements()).map(x => x.tag)).toEqual(['sequence-node']);
  view.detachDocument();
  await view.attachDocument(first);
  expect(first.rootDesignItem.firstChild).toBe(item);
  expect((await palette.getElements()).map(x => x.tag)).toEqual(['flow-node']);
  view.dispose();
  await first.dispose();
  await second.dispose();
});

test('ZPL setup supports detached property edits, writing and undo', async () => {
  if (!globalThis.FontFace) Object.defineProperty(globalThis, 'FontFace', { value: class {
    load() { return Promise.resolve(this); }
  } });
  if (!document.fonts) Object.defineProperty(document, 'fonts', { value: { add() { } } });
  const { LazyLoader } = await import('@node-projects/base-custom-webcomponent');
  jest.spyOn(LazyLoader, 'LoadText').mockResolvedValue('{"elements":[]}');
  const { createZplDesignerServiceContainer } = await import('../../web-component-designer-zpl/src/setupZplServiceContainer');
  const doc = new core.EditingDocument(createZplDesignerServiceContainer() as any);
  await doc.loadHtml('^XA^FO10,20^A0N,30,30^FDHello^FS^XZ');
  const item = [...doc.rootDesignItem.children()].find(item => item.name === 'zpl-text');
  expect(item).toBeDefined();
  item.setAttribute('content', 'Updated');
  expect(await doc.serialize()).toContain('Updated');
  doc.instanceServiceContainer.undoService.undo();
  expect(await doc.serialize()).toContain('Hello');
  await doc.dispose();
});
