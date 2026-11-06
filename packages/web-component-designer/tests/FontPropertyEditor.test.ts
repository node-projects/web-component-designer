/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { FontPropertyEditor } from '../src/elements/services/propertiesService/propertyEditors/FontPropertyEditor.js';

const originalQueryLocalFonts = Object.getOwnPropertyDescriptor(window, 'queryLocalFonts');

beforeEach(() => {
  FontPropertyEditor.fontList = undefined;
});

afterEach(() => {
  FontPropertyEditor.fontList = undefined;
  if (originalQueryLocalFonts)
    Object.defineProperty(window, 'queryLocalFonts', originalQueryLocalFonts);
  else
    delete (window as any).queryLocalFonts;
});

test.each(['unavailable', 'denied', 'blocked', 'empty'])('uses fallback fonts when local font access is %s', async state => {
  Object.defineProperty(window, 'queryLocalFonts', {
    configurable: true,
    value: state === 'unavailable' ? undefined : jest.fn(async () => {
      if (state === 'denied' || state === 'blocked')
        throw new DOMException('Local font access failed', state === 'denied' ? 'NotAllowedError' : 'SecurityError');
      return [];
    })
  });
  const select = document.createElement('select');

  await FontPropertyEditor.addFontsToSelect(select);

  expect(Array.from(select.options, option => option.value)).toContain('Arial');
  expect(select.options.length).toBeGreaterThan(1);
});

test('loads unique local font families and reuses them for another select', async () => {
  const queryLocalFonts = jest.fn(async () => [{ family: 'Local Font' }, { family: 'Local Font' }, { family: 'Other Font' }]);
  Object.defineProperty(window, 'queryLocalFonts', { configurable: true, value: queryLocalFonts });
  const first = document.createElement('select');
  const second = document.createElement('select');

  await FontPropertyEditor.addFontsToSelect(first);
  await FontPropertyEditor.addFontsToSelect(second);

  expect(Array.from(first.options, option => option.value)).toEqual(['Local Font', 'Other Font']);
  expect(Array.from(second.options, option => option.value)).toEqual(['Local Font', 'Other Font']);
  expect(queryLocalFonts).toHaveBeenCalledTimes(1);
});

test('creates a font select for the CSS font type', async () => {
  Object.defineProperty(window, 'queryLocalFonts', { configurable: true, value: undefined });
  CSSStyleSheet.prototype.replaceSync = function () { };
  const { DefaultPropertyEditorTypesService } = await import('../src/elements/services/propertiesService/DefaultPropertyEditorTypesService.js');
  const { PropertyType } = await import('../src/elements/services/propertiesService/PropertyType.js');
  const editor = new DefaultPropertyEditorTypesService().getEditorForProperty({
    name: 'font-family', type: 'css-font', propertyType: PropertyType.cssValue, service: {} as any
  });

  const select = editor.element.querySelector('select');
  expect(select).not.toBeNull();
  expect(Array.from(select.options, option => option.value)).toContain('Arial');
});
