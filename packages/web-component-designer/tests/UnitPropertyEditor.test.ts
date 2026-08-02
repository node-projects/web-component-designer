/** @jest-environment jsdom */
import { beforeAll, expect, jest, test } from '@jest/globals';
import { PropertyType } from '../src/elements/services/propertiesService/PropertyType';
import type { IProperty } from '../src/elements/services/propertiesService/IProperty';

let UnitPropertyEditor: typeof import('../src/elements/services/propertiesService/propertyEditors/UnitPropertyEditor').UnitPropertyEditor;

beforeAll(async () => {
  if (!CSSStyleSheet.prototype.replaceSync)
    Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', { value() { } });
  ({ UnitPropertyEditor } = await import('../src/elements/services/propertiesService/propertyEditors/UnitPropertyEditor'));
});

test('restores the numeric editor value when an addon preview is cancelled', async () => {
  const property: IProperty = {
    name: 'rotate',
    type: 'css-angle',
    service: {} as any,
    propertyType: PropertyType.cssValue
  };
  const editor = new UnitPropertyEditor(property);
  editor.element.value = '10deg';
  editor.element.addon.click();
  const popup = document.body.lastElementChild as HTMLElement;
  popup.dispatchEvent(Object.assign(new Event('pointerdown'), { clientX: 10, clientY: 10, pointerId: 1 }));
  popup.dispatchEvent(new Event('pointercancel'));
  await Promise.resolve();
  expect(editor.element.value).toBe('10deg');
  editor.element.remove();
});

test('clears the addon preview before committing a selected value', async () => {
  const previewValue = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const removePreviewValue = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const setValue = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const property: IProperty = {
    name: 'rotate',
    type: 'css-angle',
    service: { previewValue, removePreviewValue, setValue } as any,
    propertyType: PropertyType.cssValue
  };
  const editor = new UnitPropertyEditor(property);
  const designItem = {
    openGroup: () => ({ commit: jest.fn() })
  } as any;
  editor.designItemsChanged([designItem]);
  editor.element.value = '10deg';
  editor.element.addon.click();
  const popup = document.body.lastElementChild as HTMLElement;
  Object.defineProperty(popup, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 100, height: 100 }) });
  popup.dispatchEvent(Object.assign(new Event('pointerdown'), { clientX: 100, clientY: 50, pointerId: 1 }));
  popup.dispatchEvent(Object.assign(new Event('pointerup'), { clientX: 100, clientY: 50, pointerId: 1 }));
  await Promise.resolve();
  await Promise.resolve();
  expect(previewValue).toHaveBeenCalledWith([designItem], property, '0deg');
  expect(removePreviewValue).toHaveBeenCalledWith([designItem], property);
  expect(setValue).toHaveBeenCalledWith([designItem], property, '0deg');
  editor.element.remove();
  popup.remove();
});

test('does not open or change a readonly angle property', async () => {
  const previewValue = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const setValue = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const property: IProperty = {
    name: 'rotate',
    type: 'css-angle',
    readonly: true,
    service: { previewValue, setValue } as any,
    propertyType: PropertyType.cssValue
  };
  const editor = new UnitPropertyEditor(property);
  editor.element.addon.click();
  expect((editor.element.addon as HTMLButtonElement).disabled).toBe(true);
  expect(document.body.querySelector('[data-angle-hand]')).toBeNull();
  expect(previewValue).not.toHaveBeenCalled();
  expect(setValue).not.toHaveBeenCalled();
  editor.element.remove();
});
