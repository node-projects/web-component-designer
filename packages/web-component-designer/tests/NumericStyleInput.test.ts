import { expect, test } from '@jest/globals';
import type { IProperty } from '../src/elements/services/propertiesService/IProperty';
import { PropertyType } from '../src/elements/services/propertiesService/PropertyType';
import { combineNumericStyleInputValue, getNumericStyleInputUnitLabel, normalizeNumericStyleInputOptionValues, parseNumericStyleInputValue, resolveNumericStyleInputSelectedUnit, resolveNumericStyleInputStep } from '../src/elements/controls/NumericStyleInputValueHelpers';
import { applyCssNumericPropertyDefaults, convertNumericUnitValue, defaultCssNumericUnits, defaultCssNumericUnitSteps } from '../src/elements/services/propertiesService/propertyEditors/UnitPropertyEditorConfig';

test('parses numeric, fixed, and custom values', () => {
  expect(parseNumericStyleInputValue('12px')).toEqual({ kind: 'numeric', numberText: '12', value: 12, unit: 'px' });
  expect(parseNumericStyleInputValue('auto')).toEqual({ kind: 'text', text: 'auto' });
  expect(parseNumericStyleInputValue('calc(100% - 4px)')).toEqual({ kind: 'text', text: 'calc(100% - 4px)' });
  expect(parseNumericStyleInputValue('')).toEqual({ kind: 'empty' });
  expect(combineNumericStyleInputValue('24', 'rem')).toBe('24rem');
});

test('numeric style input helpers preserve the unitless option', () => {
  expect(normalizeNumericStyleInputOptionValues(['', '%', ' ', '%'])).toEqual(['', '%']);
  expect(getNumericStyleInputUnitLabel('')).toBe(' ');
  expect(resolveNumericStyleInputSelectedUnit('', '%', ['', '%'])).toBe('');
  expect(resolveNumericStyleInputSelectedUnit(undefined, '', ['', '%'])).toBe('');
  expect(resolveNumericStyleInputSelectedUnit('rem', '', ['', '%'])).toBe('');
  expect(resolveNumericStyleInputStep({ '': 0.1, '%': 10 }, 1, '')).toBe(0.1);
  expect(resolveNumericStyleInputStep({ '': 0.1, '%': 10 }, 1, '%')).toBe(10);
  expect(resolveNumericStyleInputStep({ '': 0.1, '%': 10 }, 1, 'px')).toBe(1);
});

test('converts css numeric values outside the editor', () => {
  const baseProperty = {
    name: 'margin-left',
    service: {} as any,
    propertyType: PropertyType.cssValue
  } satisfies Omit<IProperty, 'type'>;

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-length' },
    numericType: 'css-length',
    value: 96,
    numberText: '96',
    rawValue: '96px',
    fromUnit: 'px',
    toUnit: 'in'
  })).toBe('1in');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-angle' },
    numericType: 'css-angle',
    value: 180,
    numberText: '180',
    rawValue: '180deg',
    fromUnit: 'deg',
    toUnit: 'turn'
  })).toBe('0.5turn');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-time' },
    numericType: 'css-time',
    value: 1500,
    numberText: '1500',
    rawValue: '1500ms',
    fromUnit: 'ms',
    toUnit: 's'
  })).toBe('1.5s');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-length' },
    numericType: 'css-length',
    value: 10,
    numberText: '10',
    rawValue: '10%',
    fromUnit: '%',
    toUnit: 'cm'
  })).toBe('10cm');

  const originalGetComputedStyle = globalThis.getComputedStyle;
  const originalWindow = globalThis.window;
  const parentElement = {
    getBoundingClientRect: () => ({ width: 400, height: 200 }),
  } as any;
  const element = {
    parentElement,
    getBoundingClientRect: () => ({ width: 133.3333, height: 72 })
  } as any;
  const measuredElement = {
    parentElement,
    getBoundingClientRect: () => ({ width: 160, height: 72 })
  } as any;
  const fakeWindow = { innerWidth: 1200, innerHeight: 800 } as any;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: (target: any) => {
      if (target === parentElement)
        return { fontSize: '16px' };
      if (target === element)
        return { fontSize: '20px' };
      if (target === globalThis.document?.documentElement)
        return { fontSize: '16px' };
      return { fontSize: '16px' };
    }
  });

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-length', name: 'width' },
    numericType: 'css-length',
    designItems: [{ element } as any],
    value: 133.3333,
    numberText: '133.3333',
    rawValue: '133.3333px',
    fromUnit: 'px',
    toUnit: '%'
  })).toBe('33.33%');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-length', name: 'width' },
    numericType: 'css-length',
    designItems: [{ element } as any],
    value: Number.NaN,
    numberText: '',
    rawValue: 'initial',
    fromUnit: '',
    toUnit: '%'
  })).toBe('33.33%');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-length', name: 'width' },
    numericType: 'css-length',
    designItems: [{ element } as any],
    value: 33.33,
    numberText: '33.33',
    rawValue: '33.33%',
    fromUnit: '%',
    toUnit: 'px'
  })).toBe('133.32px');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-length', name: 'width', numericValueDecimalPlaces: 3 },
    numericType: 'css-length',
    designItems: [{ element } as any],
    value: 133.3333,
    numberText: '133.3333',
    rawValue: '133.3333px',
    fromUnit: 'px',
    toUnit: '%'
  })).toBe('33.333%');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-length', name: 'width' },
    numericType: 'css-length',
    designItems: [{ element: measuredElement } as any],
    value: 100,
    numberText: '100',
    rawValue: '100px',
    fromUnit: 'px',
    toUnit: '%'
  })).toBe('40%');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-scale', name: 'zoom' },
    numericType: 'css-scale',
    value: 2,
    numberText: '2',
    rawValue: '2',
    fromUnit: '',
    toUnit: '%'
  })).toBe('200%');

  expect(convertNumericUnitValue({
    property: { ...baseProperty, type: 'css-scale', name: 'zoom' },
    numericType: 'css-scale',
    value: 200,
    numberText: '200',
    rawValue: '200%',
    fromUnit: '%',
    toUnit: ''
  })).toBe('2');

  if (originalGetComputedStyle == null)
    delete (globalThis as any).getComputedStyle;
  else
    Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, value: originalGetComputedStyle });

  if (originalWindow == null)
    delete (globalThis as any).window;
  else
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
});

test('abstract css properties service fills css numeric metadata', () => {
  const property = applyCssNumericPropertyDefaults({
    name: 'width',
    type: 'css-length',
    values: ['auto'],
    service: {} as any,
    propertyType: PropertyType.cssValue
  });

  expect(property.units).toEqual(defaultCssNumericUnits['css-length']);
  expect(property.unitSteps).toEqual(defaultCssNumericUnitSteps['css-length']);
  expect(property.values).toEqual(['auto', 'initial', 'inherit', 'unset']);

  const originalGetComputedStyle = globalThis.getComputedStyle;
  const hostElement = {
    getBoundingClientRect: () => ({ width: 400, height: 200 })
  } as any;
  const element = {
    parentElement: null,
    ownerDocument: { body: hostElement, documentElement: hostElement },
    getRootNode: () => ({ host: hostElement }),
    getBoundingClientRect: () => ({ width: 160, height: 80 })
  } as any;

  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ fontSize: '16px' })
  });
  
  expect(property.numericValueConverter?.(100, 'px', '%', property, 'css-length', '100', '100px', [{ element } as any])).toBe('40%');

  if (originalGetComputedStyle == null)
    delete (globalThis as any).getComputedStyle;
  else
    Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, value: originalGetComputedStyle });
});