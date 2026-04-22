import type { IDesignItem } from '../../../item/IDesignItem.js';
import type { IProperty } from '../IProperty.js';

export type CssNumericPropertyType = 'length' | 'angle' | 'time' | 'frequency' | 'flex' | 'resolution' | 'scale';

export type CssNumericUnitConversionResult = string | number | null | undefined;

export type CssNumericUnitConversionContext = {
  property: IProperty,
  numericType: CssNumericPropertyType,
  designItems?: IDesignItem[],
  value: number,
  numberText: string,
  rawValue: string,
  fromUnit: string,
  toUnit: string
};

export type CssNumericEditorConfig = {
  numericType: CssNumericPropertyType,
  units: string[],
  fixedValues: string[],
  unitSteps: Record<string, number>,
  convertValue: (context: Omit<CssNumericUnitConversionContext, 'property' | 'numericType'>) => string
};

const cssNumericKeywordValues = ['initial', 'inherit', 'unset'];

export const defaultCssNumericUnits: Record<CssNumericPropertyType, string[]> = {
  length: ['px', '%', 'em', 'rem', 'vw', 'vh', 'vmin', 'vmax', 'pt', 'pc', 'in', 'cm', 'mm', 'q', 'ch', 'ex'],
  angle: ['deg', 'grad', 'rad', 'turn'],
  time: ['ms', 's'],
  frequency: ['hz', 'khz'],
  flex: ['fr'],
  resolution: ['dpi', 'dpcm', 'dppx', 'x'],
  scale: ['', '%']
};

export const defaultCssNumericUnitSteps: Record<CssNumericPropertyType, Record<string, number>> = {
  length: { em: 0.1, rem: 0.1, 'in': 0.01, cm: 0.1, ch: 0.1, ex: 0.1 },
  angle: { rad: 0.01, turn: 0.1 },
  time: { ms: 10, s: 0.1 },
  frequency: { khz: 0.1 },
  flex: { fr: 0.1 },
  resolution: { dppx: 0.1, x: 0.1 },
  scale: { '': 0.1, '%': 10 }
};

const inferredCssNumericPropertyNames: Record<CssNumericPropertyType, Set<string>> = {
  length: new Set([
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'blockSize',
    'inlineSize',
    'minBlockSize',
    'minInlineSize',
    'maxBlockSize',
    'maxInlineSize',
    'top',
    'left',
    'right',
    'bottom',
    'fontSize',
    'lineHeight',
    'columnGap',
    'rowGap',
    'gap',
    'flexBasis',
    'letterSpacing',
    'wordSpacing',
    'textIndent',
    'outlineWidth',
    'outlineOffset',
    'perspective'
  ]),
  angle: new Set([
    'rotate',
    'offsetRotate'
  ]),
  time: new Set([
    'animationDelay',
    'animationDuration',
    'transitionDelay',
    'transitionDuration'
  ]),
  frequency: new Set(),
  flex: new Set(),
  resolution: new Set([
    'imageResolution'
  ]),
  scale: new Set([
    'zoom',
    'scale'
  ])
};

const absoluteLengthUnitInPx = new Map<string, number>([
  ['px', 1],
  ['in', 96],
  ['cm', 96 / 2.54],
  ['mm', 96 / 25.4],
  ['q', 96 / 101.6],
  ['pt', 96 / 72],
  ['pc', 16]
]);

const angleUnitInDeg = new Map<string, number>([
  ['deg', 1],
  ['grad', 0.9],
  ['rad', 180 / Math.PI],
  ['turn', 360]
]);

const timeUnitInMs = new Map<string, number>([
  ['ms', 1],
  ['s', 1000]
]);

const frequencyUnitInHz = new Map<string, number>([
  ['hz', 1],
  ['khz', 1000]
]);

const resolutionUnitInDpi = new Map<string, number>([
  ['dpi', 1],
  ['dpcm', 2.54],
  ['dppx', 96],
  ['x', 96]
]);

const horizontalPercentageReferencePropertyNames = new Set([
  'width',
  'minWidth',
  'maxWidth',
  'inlineSize',
  'minInlineSize',
  'maxInlineSize',
  'left',
  'right',
  'columnGap',
  'gap',
  'flexBasis',
  'perspective'
]);

const verticalPercentageReferencePropertyNames = new Set([
  'height',
  'minHeight',
  'maxHeight',
  'top',
  'bottom',
  'blockSize',
  'minBlockSize',
  'maxBlockSize',
  'rowGap'
]);

const horizontalMeasuredSizePropertyNames = new Set([
  'width',
  'minWidth',
  'maxWidth',
  'inlineSize',
  'minInlineSize',
  'maxInlineSize'
]);

const verticalMeasuredSizePropertyNames = new Set([
  'height',
  'minHeight',
  'maxHeight',
  'blockSize',
  'minBlockSize',
  'maxBlockSize'
]);

function formatNumericStyleInputNumber(value: number, maxDecimalPlaces: number = 4): string {
  if (!Number.isFinite(value))
    return '0';
  const factor = 10 ** Math.max(0, maxDecimalPlaces);
  const roundedValue = Math.round(value * factor) / factor;
  return Object.is(roundedValue, -0) ? '0' : `${roundedValue}`;
}

function combineNumericStyleInputValue(numberText: string, unit: string): string {
  const trimmedNumberText = numberText?.trim() ?? '';
  if (!trimmedNumberText)
    return '';
  return trimmedNumberText + (unit ?? '');
}

function parseNumericStyleInputValue(value?: string | null) {
  const text = value?.trim() ?? '';
  if (!text)
    return { kind: 'empty' } as const;

  const match = text.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:([a-z%]+))?$/i);
  if (!match)
    return { kind: 'text', text } as const;

  const numericValue = Number(match[1]);
  if (Number.isNaN(numericValue))
    return { kind: 'text', text } as const;

  return {
    kind: 'numeric' as const,
    numberText: match[1],
    value: numericValue,
    unit: match[2]?.toLowerCase() ?? ''
  };
}

function dashToCamelCase(text?: string): string {
  return text?.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()) ?? '';
}

function camelToDashCase(text?: string): string {
  return text?.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) ?? '';
}

function getNumericValueDecimalPlaces(context: CssNumericUnitConversionContext): number {
  return context.property.numericValueDecimalPlaces ?? (context.fromUnit === '%' || context.toUnit === '%' ? 2 : 4);
}

function normalizeConvertedValue(result: CssNumericUnitConversionResult, toUnit: string, decimalPlaces: number): string | null {
  if (result == null)
    return null;
  if (typeof result === 'number')
    return combineNumericStyleInputValue(formatNumericStyleInputNumber(result, decimalPlaces), toUnit);
  return result;
}

function getPrimaryElement(context: CssNumericUnitConversionContext): HTMLElement | null {
  return <HTMLElement>context.designItems?.[0]?.element ?? null;
}

function isHTMLElementLike(value: unknown): value is HTMLElement {
  if (!value)
    return false;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement)
    return true;
  return typeof (value as { getBoundingClientRect?: unknown }).getBoundingClientRect === 'function';
}

function getParentReferenceElement(element: HTMLElement): HTMLElement | null {
  if (!element)
    return null;
  if (element.parentElement)
    return element.parentElement;
  if (element.assignedSlot)
    return element.assignedSlot;

  const rootNode = element.getRootNode?.();
  const host = (rootNode as { host?: unknown })?.host;
  if (isHTMLElementLike(host))
    return host;

  const ownerDocument = element.ownerDocument;
  return ownerDocument?.body ?? ownerDocument?.documentElement ?? null;
}

function getComputedPixelValue(value: string | null | undefined): number | null {
  const numericValue = parseFloat(value ?? '');
  if (Number.isNaN(numericValue))
    return null;
  return numericValue;
}

function readComputedCssValue(context: CssNumericUnitConversionContext): string | null {
  if (typeof getComputedStyle !== 'function')
    return null;

  const element = getPrimaryElement(context);
  if (!element)
    return null;

  const computedStyle = getComputedStyle(element);
  const propertyName = context.property.propertyName ?? context.property.name;
  if (!propertyName)
    return null;

  const getPropertyValue = typeof (computedStyle as CSSStyleDeclaration & { getPropertyValue?: unknown }).getPropertyValue === 'function'
    ? (name: string) => computedStyle.getPropertyValue(name)
    : (_name: string) => '';

  if (propertyName.startsWith('--'))
    return getPropertyValue(propertyName)?.trim() ?? null;

  const dashName = propertyName.includes('-') ? propertyName : camelToDashCase(propertyName);
  const directValue = getPropertyValue(dashName)?.trim();
  if (directValue)
    return directValue;

  const camelName = dashToCamelCase(propertyName);
  return (computedStyle as CSSStyleDeclaration & Record<string, string>)[camelName]?.trim() ?? null;
}

function getConvertibleNumericContext(context: CssNumericUnitConversionContext): CssNumericUnitConversionContext | null {
  const parsedRawValue = parseNumericStyleInputValue(context.rawValue);
  if (parsedRawValue.kind === 'numeric') {
    return {
      ...context,
      value: parsedRawValue.value,
      numberText: parsedRawValue.numberText,
      fromUnit: parsedRawValue.unit || context.fromUnit,
      rawValue: combineNumericStyleInputValue(parsedRawValue.numberText, parsedRawValue.unit)
    };
  }

  const computedValue = readComputedCssValue(context);
  const parsedComputedValue = parseNumericStyleInputValue(computedValue);
  if (parsedComputedValue.kind !== 'numeric') {
    if (context.numericType !== 'length')
      return null;

    const measuredSizeInPx = getMeasuredSizeInPx(context);
    if (measuredSizeInPx == null)
      return null;

    const numberText = formatNumericStyleInputNumber(measuredSizeInPx);
    return {
      ...context,
      value: measuredSizeInPx,
      numberText,
      fromUnit: 'px',
      rawValue: combineNumericStyleInputValue(numberText, 'px')
    };
  }

  return {
    ...context,
    value: parsedComputedValue.value,
    numberText: parsedComputedValue.numberText,
    fromUnit: parsedComputedValue.unit,
    rawValue: combineNumericStyleInputValue(parsedComputedValue.numberText, parsedComputedValue.unit)
  };
}

function getViewportUnitInPx(unit: string): number | null {
  if (typeof window === 'undefined')
    return null;
  switch (unit) {
    case 'vw':
      return window.innerWidth / 100;
    case 'vh':
      return window.innerHeight / 100;
    case 'vmin':
      return Math.min(window.innerWidth, window.innerHeight) / 100;
    case 'vmax':
      return Math.max(window.innerWidth, window.innerHeight) / 100;
    default:
      return null;
  }
}

function getFontSizeReferenceInPx(context: CssNumericUnitConversionContext, relativeToParent: boolean): number | null {
  if (typeof getComputedStyle !== 'function')
    return null;
  const element = getPrimaryElement(context);
  if (!element)
    return null;

  const referenceElement = relativeToParent ? (getParentReferenceElement(element) ?? element) : element;
  return getComputedPixelValue(getComputedStyle(referenceElement).fontSize);
}

function getRootFontSizeInPx(): number | null {
  if (typeof getComputedStyle !== 'function' || typeof document === 'undefined')
    return null;
  return getComputedPixelValue(getComputedStyle(document.documentElement).fontSize);
}

function getPercentageReferenceInPx(context: CssNumericUnitConversionContext): number | null {
  if (typeof getComputedStyle !== 'function')
    return null;
  const element = getPrimaryElement(context);
  if (!element)
    return null;

  const propertyName = dashToCamelCase(context.property.propertyName ?? context.property.name);
  if (propertyName === 'fontSize')
    return getFontSizeReferenceInPx(context, true);
  if (propertyName === 'lineHeight')
    return getFontSizeReferenceInPx(context, false);

  const referenceElement = getParentReferenceElement(element) ?? element;
  const rect = referenceElement.getBoundingClientRect?.();
  if (!rect)
    return null;

  if (verticalPercentageReferencePropertyNames.has(propertyName))
    return rect.height;
  if (horizontalPercentageReferencePropertyNames.has(propertyName))
    return rect.width;
  return rect.width;
}

function getMeasuredSizeInPx(context: CssNumericUnitConversionContext): number | null {
  const element = getPrimaryElement(context);
  if (!element)
    return null;

  const rect = element.getBoundingClientRect?.();
  if (!rect)
    return null;

  const propertyName = dashToCamelCase(context.property.propertyName ?? context.property.name);
  if (horizontalMeasuredSizePropertyNames.has(propertyName))
    return rect.width;
  if (verticalMeasuredSizePropertyNames.has(propertyName))
    return rect.height;

  return null;
}

function getLengthUnitSizeInPx(context: CssNumericUnitConversionContext, unit: string): number | null {
  const normalizedUnit = unit?.toLowerCase() ?? '';
  if (!normalizedUnit)
    return null;

  const absoluteUnitSize = absoluteLengthUnitInPx.get(normalizedUnit);
  if (absoluteUnitSize != null)
    return absoluteUnitSize;

  if (normalizedUnit === '%') {
    const percentageReference = getPercentageReferenceInPx(context);
    return percentageReference == null ? null : percentageReference / 100;
  }

  if (normalizedUnit === 'em')
    return getFontSizeReferenceInPx(context, dashToCamelCase(context.property.propertyName ?? context.property.name) === 'fontSize');
  if (normalizedUnit === 'rem')
    return getRootFontSizeInPx();
  if (normalizedUnit === 'ex') {
    const fontSize = getFontSizeReferenceInPx(context, false);
    return fontSize == null ? null : fontSize / 2;
  }
  if (normalizedUnit === 'ch') {
    const fontSize = getFontSizeReferenceInPx(context, false);
    return fontSize == null ? null : fontSize / 2;
  }

  return getViewportUnitInPx(normalizedUnit);
}

export function defaultConvertCssNumericUnitValue(context: CssNumericUnitConversionContext): string {
  const convertibleContext = getConvertibleNumericContext(context);
  if (!convertibleContext)
    return combineNumericStyleInputValue(context.numberText, context.toUnit);

  const decimalPlaces = getNumericValueDecimalPlaces(context);

  let convertedValue: number | null;
  switch (convertibleContext.numericType) {
    case 'length':
      convertedValue = convertLengthValue(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, convertibleContext);
      break;
    case 'angle':
      convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, angleUnitInDeg);
      break;
    case 'time':
      convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, timeUnitInMs);
      break;
    case 'frequency':
      convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, frequencyUnitInHz);
      break;
    case 'resolution':
      convertedValue = convertUsingUnitTable(convertibleContext.value, convertibleContext.fromUnit, convertibleContext.toUnit, resolutionUnitInDpi);
      break;
    case 'flex':
      convertedValue = convertibleContext.value;
      break;
  }

  if (convertedValue == null)
    return combineNumericStyleInputValue(convertibleContext.numberText, convertibleContext.toUnit);

  return combineNumericStyleInputValue(formatNumericStyleInputNumber(convertedValue, decimalPlaces), convertibleContext.toUnit);
}

function convertLengthValue(value: number, fromUnit: string, toUnit: string, context: CssNumericUnitConversionContext): number | null {
  const normalizedFromUnit = fromUnit?.toLowerCase() ?? '';
  const normalizedToUnit = toUnit?.toLowerCase() ?? '';
  if (normalizedFromUnit !== '%' && normalizedToUnit === '%') {
    const measuredSizeInPx = getMeasuredSizeInPx(context);
    const percentUnitSize = getLengthUnitSizeInPx(context, normalizedToUnit);
    if (measuredSizeInPx != null && percentUnitSize != null)
      return measuredSizeInPx / percentUnitSize;
  }

  const fromUnitSize = getLengthUnitSizeInPx(context, fromUnit);
  const toUnitSize = getLengthUnitSizeInPx(context, toUnit);
  if (fromUnitSize == null || toUnitSize == null)
    return null;
  return value * fromUnitSize / toUnitSize;
}

function convertUsingUnitTable(value: number, fromUnit: string, toUnit: string, table?: Map<string, number>): number | null {
  const normalizedFromUnit = fromUnit?.toLowerCase() ?? '';
  const normalizedToUnit = toUnit?.toLowerCase() ?? '';
  if (!normalizedFromUnit || !normalizedToUnit || normalizedFromUnit === normalizedToUnit)
    return value;
  if (!table)
    return null;

  const fromFactor = table.get(normalizedFromUnit);
  const toFactor = table.get(normalizedToUnit);
  if (fromFactor == null || toFactor == null)
    return null;

  return value * fromFactor / toFactor;
}

export function getCssNumericPropertyType(type?: string, propertyName?: string): CssNumericPropertyType | null {
  if (type === 'css-length')
    return 'length';
  if (type === 'length' || type === 'angle' || type === 'time' || type === 'frequency' || type === 'flex' || type === 'resolution')
    return type;

  const camelName = dashToCamelCase(propertyName);
  if (!camelName)
    return null;

  for (const numericType of <CssNumericPropertyType[]>Object.keys(inferredCssNumericPropertyNames)) {
    if (inferredCssNumericPropertyNames[numericType].has(camelName))
      return numericType;
  }

  return null;
}

export function isCssNumericPropertyType(type?: string, propertyName?: string): boolean {
  return getCssNumericPropertyType(type, propertyName) != null;
}

export function convertCssNumericUnitValue(context: CssNumericUnitConversionContext): string {
  const decimalPlaces = getNumericValueDecimalPlaces(context);
  const overrideResult = normalizeConvertedValue(
    context.property.numericValueConverter?.(context.value, context.fromUnit, context.toUnit, context.property, context.numericType, context.numberText, context.rawValue, context.designItems),
    context.toUnit,
    decimalPlaces
  );
  if (overrideResult != null)
    return overrideResult;
  return defaultConvertCssNumericUnitValue(context);
}

export function getCssNumericKeywordValues(values?: string[]): string[] {
  return [...new Set([...(values ?? []), ...cssNumericKeywordValues].filter(Boolean))];
}

export function applyCssNumericPropertyDefaults(property: IProperty): IProperty {
  const numericType = getCssNumericPropertyType(property.type, property.propertyName ?? property.name);
  property.values = getCssNumericKeywordValues(property.values);
  if (numericType) {
    property.units ??= [...defaultCssNumericUnits[numericType]];
    property.unitSteps ??= { ...defaultCssNumericUnitSteps[numericType] };
    property.numericValueConverter ??= (value, fromUnit, toUnit, converterProperty, converterNumericType, numberText, rawValue, designItems) => defaultConvertCssNumericUnitValue({
      property: converterProperty,
      numericType: <CssNumericPropertyType>converterNumericType,
      designItems,
      value,
      numberText: numberText ?? `${value}`,
      rawValue: rawValue ?? `${value}${fromUnit}`,
      fromUnit,
      toUnit,
    });
  }
  return property;
}

export function getCssNumericEditorConfig(property: IProperty): CssNumericEditorConfig | null {
  const numericType = getCssNumericPropertyType(property.type, property.name);
  if (!numericType)
    return null;

  return {
    numericType,
    units: property.units?.length ? property.units : defaultCssNumericUnits[numericType],
    fixedValues: getCssNumericKeywordValues(property.values),
    unitSteps: property.unitSteps ?? defaultCssNumericUnitSteps[numericType] ?? {},
    convertValue: context => convertCssNumericUnitValue({ ...context, property, numericType })
  };
}