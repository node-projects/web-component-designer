import { DesignItem } from '../../../../item/DesignItem.js';
import type { IDesignItem } from '../../../../item/IDesignItem.js';
import type { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { getGeometryReader } from './geometry/GeometryReaderFactory.js';
import { isVisualSvgElement } from '../../../../helper/SvgHelper.js';

const editedItems = new WeakMap<IDesignerCanvas, IDesignItem>();

export function isEditingSvgPoints(canvas: IDesignerCanvas, item: IDesignItem) {
  const selection = canvas.instanceServiceContainer.selectionService;
  return selection.primarySelection === item && (canvas.serviceContainer.options.svgEditingMode === 'content' || editedItems.get(canvas) === item || selection.selectedPart?.kind === 'svg-path-handle');
}

export function getSvgObjectItem(item: IDesignItem): IDesignItem {
  if (item.serviceContainer.options.svgEditingMode === 'content') return item;
  let result = item;
  while (result.parent?.element instanceof SVGElement) result = result.parent;
  // Page-sized artwork layers contain independent drawings rather than one resizable figure.
  if (result.element instanceof SVGSVGElement && !result.element.hasAttribute('viewBox') &&
    (result.element.style.width === '100%' || result.element.getAttribute('width') === '100%') &&
    (result.element.style.height === '100%' || result.element.getAttribute('height') === '100%')) return item;
  return result;
}

export function beginSvgPointEditing(canvas: IDesignerCanvas, item: IDesignItem) {
  if (item.element instanceof SVGSVGElement) {
    const element = [...item.element.querySelectorAll('path,polygon,polyline,line,rect,ellipse,circle')].find(isVisualSvgElement);
    if (!element) return;
    item = DesignItem.GetOrCreateDesignItem(element, element, canvas.serviceContainer, canvas.instanceServiceContainer);
  }
  if (!getGeometryReader(item.element)) return;
  editedItems.set(canvas, item);
  canvas.instanceServiceContainer.selectionService.setSelectedElements([item]);
  canvas.extensionManager.reapplyAllAppliedExtentions([item]);
  canvas.clickOverlay.focus();
}

export function endSvgPointEditing(canvas: IDesignerCanvas) {
  const selection = canvas.instanceServiceContainer.selectionService;
  if (canvas.serviceContainer.options.svgEditingMode === 'content') {
    if (!(selection.primarySelection?.element instanceof SVGElement) || selection.primarySelection.element instanceof SVGSVGElement) return false;
    selection.clearSelectedElements();
    canvas.clickOverlay.focus();
    return true;
  }
  const item = editedItems.get(canvas) ?? (selection.selectedPart?.kind === 'svg-path-handle' ? selection.primarySelection : undefined);
  editedItems.delete(canvas);
  if (!item || selection.primarySelection !== item) return false;
  const object = getSvgObjectItem(item);
  selection.setSelectedElements([object]);
  if (object === item) canvas.extensionManager.reapplyAllAppliedExtentions([item]);
  canvas.clickOverlay.focus();
  return true;
}
