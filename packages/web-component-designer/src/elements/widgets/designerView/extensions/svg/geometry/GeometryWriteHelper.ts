import { IDesignItem } from '../../../../../item/IDesignItem.js';
import { IGeometryWrite } from './IGeometry.js';

function hasStyleTarget(element: Element): element is Element & { style: CSSStyleDeclaration } {
  return 'style' in element;
}

export function applyGeometryWritesToElement(element: Element, writes: IGeometryWrite[]) {
  for (const write of writes) {
    if (write.target === 'style' && hasStyleTarget(element)) {
      element.style.setProperty(write.attribute, write.value);
    } else {
      element.setAttribute(write.attribute, write.value);
    }
  }
}

export function applyGeometryWritesToDesignItem(designItem: IDesignItem, writes: IGeometryWrite[]) {
  for (const write of writes) {
    if (write.target === 'style') {
      designItem.setStyle(write.attribute, write.value);
    } else {
      designItem.setAttribute(write.attribute, write.value);
    }
  }
}