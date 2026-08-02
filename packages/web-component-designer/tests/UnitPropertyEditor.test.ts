/** @jest-environment jsdom */
import { beforeAll, expect, test } from '@jest/globals';
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
