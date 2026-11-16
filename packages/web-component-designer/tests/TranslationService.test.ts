/** @jest-environment jsdom */
import { beforeAll, expect, jest, test } from '@jest/globals';
import type * as Core from '../src/index';

Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
CSSStyleSheet.prototype.replaceSync = function () { };
Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
Object.defineProperty(globalThis, 'ResizeObserver', { value: class { observe() { } disconnect() { } unobserve() { } } });
for (const name of ['SVGPathElement', 'SVGRectElement', 'SVGCircleElement', 'SVGEllipseElement', 'SVGLineElement', 'SVGPolylineElement', 'SVGPolygonElement', 'SVGForeignObjectElement'])
  (globalThis as any)[name] = class extends SVGElement { };
(globalThis as any).MathMLElement ??= class extends Element { };

let core: typeof Core;
beforeAll(async () => {
  core = await import('../src/index');
  jest.unstable_mockModule('@node-projects/web-component-designer', () => core);
});

test('standalone containers use English fallback text without reinterpreting parameter values', () => {
  const container = new core.ServiceContainer();
  expect(container.translationService.translate('Comments ({count})', { count: '2' })).toBe('Comments (2)');
  expect(container.translationService.translate('{name}: {count}; {missing}', { name: 'User {count}', count: '2' }))
    .toBe('User {count}: 2; {missing}');
});

test('collaboration menus use the shared container translator and follow language and service changes', async () => {
  const { setupCollaborationService } = await import('../../web-component-designer-collaboration-service/src/setupCollaborationService');
  const { CollaborationCommentsContextMenu } = await import('../../web-component-designer-collaboration-service/src/extensions/CollaborationCommentsContextMenu');
  const container = new core.ServiceContainer();
  container.register('designItemService', new core.DesignItemService());
  container.register('htmlParserService', new core.DefaultHtmlParserService());
  container.register('htmlWriterService', new core.HtmlWriterService());
  container.designerContextMenuExtensions = [];
  // Jest maps the add-on's package import to this source module; its declarations use dist identities.
  setupCollaborationService(container as any);
  const document = new core.EditingDocument(container);
  await document.loadHtml('<div id="target">Original</div>');
  const item = document.rootDesignItem.firstChild as any;
  const canvas = { serviceContainer: container, instanceServiceContainer: document.instanceServiceContainer } as any;
  const menu = new CollaborationCommentsContextMenu();
  expect(menu.provideContextMenuItems(null, canvas, item)[0].title).toBe('add comment');

  let german = false;
  const fallback = new core.DefaultTranslationService();
  container.register('translationService', {
    translate: (text, params) => fallback.translate(german && text === 'add comment' ? 'Kommentar hinzufügen' : text, params)
  });
  german = true;
  expect(menu.provideContextMenuItems(null, canvas, item)[0].title).toBe('Kommentar hinzufügen');
  german = false;
  expect(menu.provideContextMenuItems(null, canvas, item)[0].title).toBe('add comment');
  container.register('translationService', { translate: () => 'Host replacement' });
  expect(menu.provideContextMenuItems(null, canvas, item)[0].title).toBe('Host replacement');
  expect(new core.ServiceContainer().translationService.translate('add comment')).toBe('add comment');
  await document.dispose();
});

test('marked tooltips and dialog labels update without changing inputs, option values or authored content', async () => {
  const listeners = new Set<() => void>();
  let german = false;
  const container = new core.ServiceContainer();
  container.register('translationService', {
    translate: (text, params) => new core.DefaultTranslationService().translate(german ? ({
      'Zoom in': 'Vergrößern', 'Absolute': 'Absolut', 'Apply': 'Anwenden', '{count} selected': '{count} ausgewählt', '{name}: all': '{name}: gesetzt'
    }[text] ?? text) : text, params),
    languageChanged: { on(listener) { listeners.add(listener); return { dispose: () => listeners.delete(listener) }; } }
  });
  const root = document.createElement('div'); document.body.append(root);
  root.innerHTML = '<button data-wcd-i18n-title="Zoom in">+</button><input value="Zoom in"><select><option value="absolute" data-wcd-i18n-text="Absolute">Absolute</option></select><span id="count"></span><div id="node-projects-designer-canvas-canvas"><span data-wcd-i18n-text="Zoom in">User document</span></div>';
  const widget = document.createElement('div'); const shadow = widget.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button data-wcd-i18n-text="Apply">Apply</button>'; root.append(widget);
  const binding = core.bindDesignerUiTranslation(root, container);
  const state = document.createElement('span'); root.append(state);
  core.PropertyGridPropertyList.refreshIsSetElementAndEditorForDesignItems(state, { name: 'User {name}' } as any,
    [{ serviceContainer: container }] as any, { isSet: () => core.ValueType.all, getValue: () => 'Original value' } as any);
  core.setDesignerUiTranslation(root.querySelector('#count'), '{count} selected', 'text', { count: '3' });
  root.querySelector('input').value = 'Original text';
  german = true; for (const listener of listeners) listener();
  expect(root.querySelector('button').title).toBe('Vergrößern');
  expect(shadow.querySelector('button').textContent).toBe('Anwenden');
  expect(root.querySelector('select').selectedOptions[0].textContent).toBe('Absolut');
  expect(root.querySelector('select').value).toBe('absolute');
  expect(root.querySelector('input').value).toBe('Original text');
  expect(root.querySelector('#count').textContent).toBe('3 ausgewählt');
  expect(root.querySelector('#node-projects-designer-canvas-canvas span').textContent).toBe('User document');
  expect(state.title).toBe('User {name}: gesetzt');
  german = false; for (const listener of listeners) listener();
  expect(state.title).toBe('User {name}: all');
  german = true; for (const listener of listeners) listener();
  binding.dispose(); expect(listeners.size).toBe(0);
  german = false; for (const listener of listeners) listener();
  expect(root.querySelector('button').title).toBe('Vergrößern'); root.remove();
});

test('canvas menus and property-edit prompts translate labels while retaining command and property values', async () => {
  const container = new core.ServiceContainer();
  container.register('translationService', { translate: (text, params) => new core.DefaultTranslationService().translate(({
    copy: 'Kopieren', cut: 'Ausschneiden', paste: 'Einfügen', delete: 'Löschen', clear: 'Zurücksetzen',
    'edit as text': 'Als Text bearbeiten', "edit value of '{name}' as string:": "Wert von '{name}' als Text bearbeiten:"
  }[text] ?? text), params) });
  const executeCommand = jest.fn();
  const canvas = { serviceContainer: container, executeCommand } as any;
  const menu = new core.CopyPasteContextMenu().provideContextMenuItems(null, canvas, {} as any);
  expect(menu[0].title).toBe('Kopieren'); menu[0].action(null, null, null, null);
  expect(executeCommand).toHaveBeenCalledWith({ type: core.CommandType.copy });
  const properties = new core.NativeElementsPropertiesService();
  const prompt = jest.spyOn(globalThis, 'prompt').mockReturnValue(null);
  const item = { serviceContainer: container, instanceServiceContainer: { refreshExtensions() {} } } as any;
  const property = { name: 'User {name}', service: { getValue: () => 'Unchanged value' } } as any;
  const items = properties.getContextMenu([item], property);
  expect(items[1].title).toBe('Als Text bearbeiten'); items[1].action(null, null, null, { close() {} } as any);
  await new Promise(resolve => setTimeout(resolve, 30));
  expect(prompt).toHaveBeenCalledWith("Wert von 'User {name}' als Text bearbeiten:", 'Unchanged value');
  prompt.mockRestore();
});
