/** @jest-environment jsdom */
import { expect, jest, test } from '@jest/globals';
import type { IProperty } from '../src/elements/services/propertiesService/IProperty';
import { createAngleUnitEditorAddon, getAngleInDegrees } from '../src/elements/services/propertiesService/propertyEditors/AngleUnitEditorAddon';

test.each([
  ['90deg', 90], ['100grad', 90], ['1.5707963268rad', 90], ['0.25turn', 90]
])('normalizes %s for the angle picker hand', (value, expected) => {
  expect(getAngleInDegrees(value)).toBeCloseTo(expected);
});

test('angle picker removes a preview when pointer interaction is cancelled', async () => {
  const removePreviewValue = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const context = {
    property: {} as IProperty,
    value: '1rad',
    designItems: [],
    setValue: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    previewValue: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    removePreviewValue
  };
  const button = createAngleUnitEditorAddon(context);
  document.body.appendChild(button);
  button.click();
  const popup = document.body.lastElementChild as HTMLElement;
  popup.dispatchEvent(Object.assign(new Event('pointerdown'), { clientX: 10, clientY: 10, pointerId: 1 }));
  popup.dispatchEvent(new Event('pointercancel'));
  await Promise.resolve();
  expect(context.previewValue).toHaveBeenCalled();
  expect(removePreviewValue).toHaveBeenCalled();
  expect(document.body.contains(popup)).toBe(false);
  button.remove();
});

test.each([
  ['right', 100, 50, '0deg'],
  ['top', 50, 0, '90deg'],
  ['left', 0, 50, '180deg'],
  ['bottom', 50, 100, '270deg']
])('dragging to the %s of the dial selects the expected angle', async (_position, clientX, clientY, expected) => {
  const previewValue = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const context = {
    property: {} as IProperty,
    value: '0deg',
    designItems: [],
    setValue: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    previewValue,
    removePreviewValue: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  };
  const button = createAngleUnitEditorAddon(context);
  document.body.appendChild(button);
  button.click();
  const popup = document.body.lastElementChild as HTMLElement;
  Object.defineProperty(popup, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 100, height: 100 }) });
  popup.dispatchEvent(Object.assign(new Event('pointerdown'), { clientX, clientY, pointerId: 1 }));
  popup.dispatchEvent(Object.assign(new Event('pointerup'), { clientX, clientY, pointerId: 1 }));
  await Promise.resolve();
  expect(previewValue).toHaveBeenCalledWith(expected);
  button.remove();
  popup.remove();
});
