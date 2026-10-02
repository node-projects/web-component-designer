/** @jest-environment jsdom */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';
import { BindingMode } from '../src/elements/item/BindingMode';
import { BindingTarget } from '../src/elements/item/BindingTarget';

Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
CSSStyleSheet.prototype.replaceSync = function () { };
Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
Object.defineProperty(globalThis, 'ResizeObserver', { value: class { observe() { } disconnect() { } unobserve() { } } });
Element.prototype.scrollTo = function () { };
HTMLDialogElement.prototype.showModal = function () { this.open = true; };
HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };

let EditingDocument: typeof import('../src/elements/EditingDocument').EditingDocument;
let ServiceContainer: typeof import('../src/elements/services/ServiceContainer').ServiceContainer;
let DefaultHtmlParserService: typeof import('../src/elements/services/htmlParserService/DefaultHtmlParserService').DefaultHtmlParserService;
let HtmlWriterService: typeof import('../src/elements/services/htmlWriterService/HtmlWriterService').HtmlWriterService;
let DesignItemService: typeof import('../src/elements/services/designItemService/DesignItemService').DesignItemService;
let BindingService: typeof import('../src/elements/services/bindingsService/BaseCustomWebcomponentBindingsService').BaseCustomWebcomponentBindingsService;
let ClassService: typeof import('../src/elements/widgets/propertyGrid/ClassBindingsPropertiesService').ClassBindingsPropertiesService;
let ClassGrid: typeof import('../src/elements/widgets/propertyGrid/PropertyGridClassBindings').PropertyGridClassBindings;
let PropertyList: typeof import('../src/elements/widgets/propertyGrid/PropertyGridPropertyList').PropertyGridPropertyList;
let CommonPropertiesService: typeof import('../src/elements/services/propertiesService/services/CommonPropertiesService').CommonPropertiesService;
let DefaultPropertyEditorTypesService: typeof import('../src/elements/services/propertiesService/DefaultPropertyEditorTypesService').DefaultPropertyEditorTypesService;
let PropertyGrid: typeof import('../src/elements/widgets/propertyGrid/PropertyGrid').PropertyGrid;
let PropertyGridWithHeader: typeof import('../src/elements/widgets/propertyGrid/PropertyGridWithHeader').PropertyGridWithHeader;

beforeAll(async () => {
  ({ EditingDocument } = await import('../src/elements/EditingDocument'));
  ({ ServiceContainer } = await import('../src/elements/services/ServiceContainer'));
  ({ DefaultHtmlParserService } = await import('../src/elements/services/htmlParserService/DefaultHtmlParserService'));
  ({ HtmlWriterService } = await import('../src/elements/services/htmlWriterService/HtmlWriterService'));
  ({ DesignItemService } = await import('../src/elements/services/designItemService/DesignItemService'));
  ({ BaseCustomWebcomponentBindingsService: BindingService } = await import('../src/elements/services/bindingsService/BaseCustomWebcomponentBindingsService'));
  ({ ClassBindingsPropertiesService: ClassService } = await import('../src/elements/widgets/propertyGrid/ClassBindingsPropertiesService'));
  ({ PropertyGridClassBindings: ClassGrid } = await import('../src/elements/widgets/propertyGrid/PropertyGridClassBindings'));
  ({ PropertyGridPropertyList: PropertyList } = await import('../src/elements/widgets/propertyGrid/PropertyGridPropertyList'));
  ({ CommonPropertiesService } = await import('../src/elements/services/propertiesService/services/CommonPropertiesService'));
  ({ DefaultPropertyEditorTypesService } = await import('../src/elements/services/propertiesService/DefaultPropertyEditorTypesService'));
  ({ PropertyGrid } = await import('../src/elements/widgets/propertyGrid/PropertyGrid'));
  ({ PropertyGridWithHeader } = await import('../src/elements/widgets/propertyGrid/PropertyGridWithHeader'));
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

test('round-trips class: bindings, preserving the class token and one-way syntax', async () => {
  const { doc, item, bindingService } = await fixture();
  const binding = bindingService.getBindings(item)[0];
  expect(binding.targetName).toBe('is-active');
  expect(binding.target).toBe(BindingTarget.class);
  expect(binding.mode).toBe(BindingMode.oneWay);
  bindingService.setBinding(item, { ...binding, expression: 'isReady' });
  expect(item.getAttribute('class:is-active')).toBe('[[isReady]]');
  expect(await doc.serialize()).toContain('class:is-active="[[isReady]]"');
  expect(item.getAttribute('class')).toBe('button primary');
  await doc.dispose();
});

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

test('adds bindings with the fallback expression editor and refreshes after undo and source changes', async () => {
  const { doc, item } = await fixture();
  const grid = new ClassGrid();
  document.body.appendChild(grid);
  grid.refresh([item]);
  grid.addBinding();
  let form = grid.shadowRoot.querySelector('form');
  (form.querySelector('input') as HTMLInputElement).value = 'is-busy';
  (form.querySelectorAll('input')[1] as HTMLInputElement).value = 'isBusy';
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  await Promise.resolve();
  expect(item.getAttribute('class:is-busy')).toBe('[[isBusy]]');
  expect(grid.shadowRoot.querySelectorAll('.row')).toHaveLength(2);
  doc.instanceServiceContainer.undoService.undo();
  grid.refresh([item]);
  expect(grid.shadowRoot.querySelectorAll('.row')).toHaveLength(1);
  item.setAttribute('class:has-error', '[[hasError]]');
  grid.refresh([item]);
  expect(grid.shadowRoot.querySelectorAll('.row')).toHaveLength(2);
  await doc.dispose();
});

test('canceling addition leaves the document unchanged and multiple selection disables addition', async () => {
  const { doc, item } = await fixture();
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

test('appearance propagates from the header to existing lists without recreating editors or losing input', async () => {
  const { services, doc, item } = await fixture();
  services.register('propertyGroupsService', { getPropertygroups: () => [{ name: 'common', propertiesService: new CommonPropertiesService() }] });
  const header = new PropertyGridWithHeader();
  document.body.appendChild(header);
  header.serviceContainer = services;
  await Promise.resolve(); // Attach the lazy template and upgrade its nested grid.
  header.propertyGrid.selectedItems = [item];
  await header.propertyGrid._selectedItemsSet();
  const tabs = header.propertyGrid.shadowRoot.querySelector('node-projects-designer-tab-control');
  const list = tabs.querySelector('node-projects-property-grid-property-list');
  const input = list.shadowRoot.querySelector('input#class') as HTMLInputElement;
  input.value = 'unsaved typed value';
  header.appearance = 'modern';
  expect(header.propertyGrid.appearance).toBe('modern');
  expect(tabs.getAttribute('appearance')).toBe('modern');
  expect(list.getAttribute('appearance')).toBe('modern');
  expect(list.shadowRoot.querySelector('node-projects-property-grid-class-bindings').getAttribute('appearance')).toBe('modern');
  expect(list.shadowRoot.querySelector('input#class')).toBe(input);
  expect(input.value).toBe('unsaved typed value');
  header.setAttribute('appearance', 'classic');
  expect(list.getAttribute('appearance')).toBe('classic');
  expect(list.shadowRoot.querySelector('input#class')).toBe(input);
  await doc.dispose();
});

test('plain grids accept modern appearance before properties are created', async () => {
  const { services, doc, item } = await fixture();
  services.register('propertyGroupsService', { getPropertygroups: () => [{ name: 'common', propertiesService: new CommonPropertiesService() }] });
  const grid = new PropertyGrid();
  grid.serviceContainer = services;
  grid.setAttribute('appearance', 'modern');
  document.body.appendChild(grid);
  grid.selectedItems = [item];
  await grid._selectedItemsSet();
  const list = grid.shadowRoot.querySelector('node-projects-designer-tab-control').querySelector('node-projects-property-grid-property-list');
  expect(list.getAttribute('appearance')).toBe('modern');
  expect(list.shadowRoot.querySelectorAll('button.property-status')).toHaveLength(4);
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
