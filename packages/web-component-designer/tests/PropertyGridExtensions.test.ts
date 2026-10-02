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

test('the default grid does not expose class bindings without an addon', async () => {
  const { services, doc, item } = await fixture();
  const list = new PropertyList(services);
  document.body.appendChild(list);
  list.setPropertiesService(new CommonPropertiesService());
  await list.createElements(item);
  list.designItemsChanged([item]);
  expect(list.shadowRoot.querySelector('node-projects-property-grid-class-bindings')).toBeNull();
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

test('an addon can extend any property and receives selection, refresh, appearance and disposal', async () => {
  const { services, doc, item } = await fixture();
  const element = document.createElement('div');
  const refresh = jest.fn();
  const dispose = jest.fn();
  services.propertyGridExtensions.push({ createExtension: property => property.name === 'title' ? { element, refresh, dispose } : undefined });
  const list = new PropertyList(services);
  document.body.appendChild(list);
  const properties = new CommonPropertiesService();
  list.setPropertiesService(properties);
  await list.createElements(item);
  list.designItemsChanged([item]);
  expect(element.previousElementSibling.querySelector('input#title')).not.toBeNull();
  expect(refresh).toHaveBeenCalledWith([item]);
  list.setAttribute('appearance', 'modern');
  expect(element.getAttribute('appearance')).toBe('modern');
  list.refreshForDesignItems([item]);
  expect(refresh).toHaveBeenCalledTimes(2);
  list.setPropertiesService(new CommonPropertiesService());
  expect(dispose).toHaveBeenCalledTimes(1);
  await doc.dispose();
});
