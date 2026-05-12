import { IDesignItem } from '../../../../../item/IDesignItem.js';
import { IGeometryWrite } from './IGeometry.js';

const numberPattern = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;

function hasStyleTarget(element: Element): element is Element & { style: CSSStyleDeclaration } {
  return 'style' in element;
}

export function roundValueToDecimalPlaces(value: number, decimalPlaces: number): string {
  if (decimalPlaces >= 0) {
    return value.toFixed(decimalPlaces);
  }
  return value.toString();
}

export function roundNumericParts(value: string, decimalPlaces: number): string {
  if (decimalPlaces < 0) {
    return value;
  }

  return value.replace(numberPattern, numberText => roundValueToDecimalPlaces(Number(numberText), decimalPlaces));
}

export function roundGeometryWrites(writes: IGeometryWrite[], decimalPlaces: number): IGeometryWrite[] {
  if (decimalPlaces < 0) {
    return writes;
  }

  return writes.map(write => ({
    ...write,
    value: roundNumericParts(write.value, decimalPlaces)
  }));
}

export function applyGeometryWritesToElement(element: Element, writes: IGeometryWrite[], decimalPlaces = -1) {
  for (const write of roundGeometryWrites(writes, decimalPlaces)) {
    if (write.target === 'style' && hasStyleTarget(element)) {
      element.style.setProperty(write.attribute, write.value);
    } else {
      element.setAttribute(write.attribute, write.value);
    }
  }
}

export function applyGeometryWritesToDesignItem(designItem: IDesignItem, writes: IGeometryWrite[]) {
  const roundedWrites = roundGeometryWrites(writes, designItem.serviceContainer.options.roundPixelsToDecimalPlaces);
  for (const write of roundedWrites) {
    if (write.target === 'style') {
      designItem.setStyle(write.attribute, write.value);
    } else {
      designItem.setAttribute(write.attribute, write.value);
    }
  }
}
