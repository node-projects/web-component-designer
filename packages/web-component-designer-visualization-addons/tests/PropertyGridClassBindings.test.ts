/** @jest-environment jsdom */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';
import { BindingTarget } from '@node-projects/web-component-designer/dist/elements/item/BindingTarget.js';

Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
CSSStyleSheet.prototype.replaceSync = function () { };
Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
Object.defineProperty(globalThis, 'ResizeObserver', { value: class { observe() { } disconnect() { } unobserve() { } } });
Element.prototype.scrollTo = function () { };
HTMLDialogElement.prototype.showModal = function () { this.open = true; };
HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };

let EditingDocument: typeof import('@node-projects/web-component-designer/dist/elements/EditingDocument.js').EditingDocument;
let ServiceContainer: typeof import('@node-projects/web-component-designer/dist/elements/services/ServiceContainer.js').ServiceContainer;
let DefaultHtmlParserService: typeof import('@node-projects/web-component-designer/dist/elements/services/htmlParserService/DefaultHtmlParserService.js').DefaultHtmlParserService;
let HtmlWriterService: typeof import('@node-projects/web-component-designer/dist/elements/services/htmlWriterService/HtmlWriterService.js').HtmlWriterService;
let DesignItemService: typeof import('@node-projects/web-component-designer/dist/elements/services/designItemService/DesignItemService.js').DesignItemService;
let BindingService: typeof import('@node-projects/web-component-designer/dist/elements/services/bindingsService/BaseCustomWebcomponentBindingsService.js').BaseCustomWebcomponentBindingsService;
let ClassService: typeof import('../src/components/ClassBindingsPropertiesService').ClassBindingsPropertiesService;
let ClassGrid: typeof import('../src/components/PropertyGridClassBindings').PropertyGridClassBindings;
let PropertyList: typeof import('@node-projects/web-component-designer/dist/elements/widgets/propertyGrid/PropertyGridPropertyList.js').PropertyGridPropertyList;
let CommonPropertiesService: typeof import('@node-projects/web-component-designer/dist/elements/services/propertiesService/services/CommonPropertiesService.js').CommonPropertiesService;
let DefaultPropertyEditorTypesService: typeof import('@node-projects/web-component-designer/dist/elements/services/propertiesService/DefaultPropertyEditorTypesService.js').DefaultPropertyEditorTypesService;

beforeAll(async () => {
  ({ EditingDocument } = await import('@node-projects/web-component-designer/dist/elements/EditingDocument.js'));
  ({ ServiceContainer } = await import('@node-projects/web-component-designer/dist/elements/services/ServiceContainer.js'));
  ({ DefaultHtmlParserService } = await import('@node-projects/web-component-designer/dist/elements/services/htmlParserService/DefaultHtmlParserService.js'));
  ({ HtmlWriterService } = await import('@node-projects/web-component-designer/dist/elements/services/htmlWriterService/HtmlWriterService.js'));
  ({ DesignItemService } = await import('@node-projects/web-component-designer/dist/elements/services/designItemService/DesignItemService.js'));
  ({ BaseCustomWebcomponentBindingsService: BindingService } = await import('@node-projects/web-component-designer/dist/elements/services/bindingsService/BaseCustomWebcomponentBindingsService.js'));
  ({ ClassBindingsPropertiesService: ClassService } = await import('../src/components/ClassBindingsPropertiesService'));
  ({ PropertyGridClassBindings: ClassGrid } = await import('../src/components/PropertyGridClassBindings'));
  ({ PropertyGridPropertyList: PropertyList } = await import('@node-projects/web-component-designer/dist/elements/widgets/propertyGrid/PropertyGridPropertyList.js'));
  ({ CommonPropertiesService } = await import('@node-projects/web-component-designer/dist/elements/services/propertiesService/services/CommonPropertiesService.js'));
  ({ DefaultPropertyEditorTypesService } = await import('@node-projects/web-component-designer/dist/elements/services/propertiesService/DefaultPropertyEditorTypesService.js'));
});

afterEach(() => document.body.replaceChildren());

async function fixture(html = '<button class="button primary" class:is-active="[[isActive]]">Submit</button>') {
  const services = new ServiceContainer();
  services.register('designItemService', new DesignItemService());
  services.register('htmlParserService', new DefaultHtmlParserService());
  services.register('htmlWriterService', new HtmlWriterService());
  services.register('bindingService', new BindingService());
  services.register('propertyEditorTypesService', new DefaultPropertyEditorTypesService());
  services.config.demoViewWidget = null;
  const doc = new EditingDocument(services);
  await doc.loadHtml(html);
  const item = doc.rootDesignItem.firstChild;
  return { services, doc, item, bindingService: services.bindingService };
}

test('renames and removes class bindings as individual undoable operations', async () => {
  const { doc, item } = await fixture();
  const service = new ClassService();
  const binding = service.getBindings(item)[0];
  service.rename(item, binding, 'is-ready');
  expect(item.hasAttribute('class:is-active')).toBe(false);
  expect(item.getAttribute('class:is-ready')).toBe('[[isActive]]');
  doc.instanceServiceContainer.undoService.undo();
  expect(item.getAttribute('class:is-active')).toBe('[[isActive]]');
  expect(item.hasAttribute('class:is-ready')).toBe(false);
  doc.instanceServiceContainer.undoService.redo();
  service.remove(item, service.getBindings(item)[0]);
  expect(service.getBindings(item)).toHaveLength(0);
  doc.instanceServiceContainer.undoService.undo();
  expect(item.getAttribute('class:is-ready')).toBe('[[isActive]]');
  expect(item.getAttribute('class')).toBe('button primary');
  await doc.dispose();
});

test('validates lowercase HTML-safe names and rejects duplicate targets', async () => {
  const { doc, item } = await fixture();
  const service = new ClassService();
  for (const name of ['', 'myClassName', 'two classes', 'bad"name', 'bad=name', 'bad/name'])
    expect(service.validateName(item, name)).toBeTruthy();
  expect(service.validateName(item, 'is-active')).toContain('already');
  expect(service.validateName(item, 'is-active', 'is-active')).toBeNull();
  expect(service.validateName(item, 'has-error')).toBeNull();
  await doc.dispose();
});

test('source-created bindings appear under class and open the host editor with a class target', async () => {
  const { services, doc, item } = await fixture();
  const openEditor = jest.fn(async () => { });
  services.config.openBindingsEditor = openEditor;
  const { ClassBindingsPropertyGridExtensionProvider } = await import('../src/components/ClassBindingsPropertyGridExtensionProvider');
  services.propertyGridExtensions.push(new ClassBindingsPropertyGridExtensionProvider());
  const list = new PropertyList(services);
  document.body.appendChild(list);
  list.setPropertiesService(new CommonPropertiesService());
  await list.createElements(item);
  list.designItemsChanged([item]);
  const section = list.shadowRoot.querySelector('node-projects-property-grid-class-bindings') as InstanceType<typeof ClassGrid>;
  expect(section.previousElementSibling.querySelector('.editor-control').id).toBe('class');
  expect(section.shadowRoot.textContent).toContain('is-active');
  (section.shadowRoot.querySelector('.name') as HTMLButtonElement).click();
  await Promise.resolve();
  expect(openEditor).toHaveBeenCalledWith(expect.objectContaining({ name: 'is-active', type: 'boolean' }), [item], expect.objectContaining({ targetName: 'is-active' }), BindingTarget.class);
  await doc.dispose();
});

test('addition asks only for a class name then delegates to the configured binding editor', async () => {
  const { services, doc, item } = await fixture();
  const openEditor = jest.fn(async () => {});
  services.config.openBindingsEditor = openEditor;
  const grid = new ClassGrid();
  document.body.appendChild(grid);
  grid.refresh([item]);
  grid.addBinding();
  const form = grid.shadowRoot.querySelector('form');
  expect(form.querySelectorAll('input')).toHaveLength(1);
  (form.querySelector('input') as HTMLInputElement).value = 'is-busy';
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  await Promise.resolve();
  expect(openEditor).toHaveBeenCalledWith(expect.objectContaining({ name: 'is-busy', type: 'boolean' }), [item], undefined, BindingTarget.class);
  expect(item.hasAttribute('class:is-busy')).toBe(false);
  await doc.dispose();
});

test('canceling addition leaves the document unchanged and multiple selection disables addition', async () => {
  const { services, doc, item } = await fixture();
  services.config.openBindingsEditor = async () => {};
  const original = await doc.serialize();
  const grid = new ClassGrid();
  document.body.appendChild(grid);
  grid.refresh([item]);
  grid.addBinding();
  (grid.shadowRoot.querySelector('.actions button[type="button"]') as HTMLButtonElement).click();
  expect(await doc.serialize()).toBe(original);
  grid.refresh([item, item]);
  expect((grid.shadowRoot.querySelector('[aria-label="Add class binding"]') as HTMLButtonElement).disabled).toBe(true);
  expect(grid.shadowRoot.textContent).toContain('Select one element');
  await doc.dispose();
});

test('failed renames roll back the new attribute instead of leaving two bindings', async () => {
  const { doc, item, bindingService } = await fixture();
  const service = new ClassService();
  const clear = jest.spyOn(bindingService, 'clearBinding').mockReturnValue(false);
  expect(() => service.rename(item, service.getBindings(item)[0], 'is-ready')).toThrow('previous binding');
  expect(item.hasAttribute('class:is-ready')).toBe(false);
  expect(item.getAttribute('class:is-active')).toBe('[[isActive]]');
  clear.mockRestore();
  await doc.dispose();
});

test('editing after a source refresh uses changed binding options even if the summary is unchanged', async () => {
  const { services, doc, item, bindingService } = await fixture();
  const binding = bindingService.getBindings(item)[0];
  let invert = false;
  const read = jest.spyOn(bindingService, 'getBindings').mockImplementation(() => [{ ...binding, invert }]);
  const openEditor = jest.fn(async () => { });
  services.config.openBindingsEditor = openEditor;
  const grid = new ClassGrid();
  document.body.appendChild(grid);
  grid.refresh([item]);
  invert = true;
  grid.refresh([item]);
  (grid.shadowRoot.querySelector('.name') as HTMLButtonElement).click();
  await Promise.resolve();
  expect(openEditor).toHaveBeenCalledWith(expect.anything(), [item], expect.objectContaining({ invert: true }), BindingTarget.class);
  read.mockRestore();
  await doc.dispose();
});
