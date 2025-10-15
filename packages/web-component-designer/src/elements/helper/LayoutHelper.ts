//TODO:  this function should return the correct property to change a layout,
// for example left/right when left or right is used,
//maybe margin on grid? or transform??

import { IPoint } from "../../interfaces/IPoint.js";
import { IDesignItem } from "../item/IDesignItem.js";
import { getBoundingClientRectAlsoForDisplayContents } from "./ElementHelper.js";

/**
 * This function filters a items list, so only the outer elments are used for example in a move
 */
export function filterChildPlaceItems(items: IDesignItem[]) {
  const filterdPlaceItems: IDesignItem[] = [];
  next:
  for (let i of items) {
    let par = i.parent;
    while (par != null && !par.isRootItem) {
      if (items.indexOf(par) >= 0)
        continue next;
      par = par.parent;
    }
    filterdPlaceItems.push(i);

  }
  return filterdPlaceItems;
}

export function getDesignItemCurrentPos(designItem: IDesignItem, mode: 'position' | 'transform' | 'margin' | 'padding'): IPoint {
  if (mode === 'position') {
    const computedStyleMovedElement = getComputedStyle(designItem.element);
    let oldLeft = parseFloat(computedStyleMovedElement.left);
    oldLeft = Number.isNaN(oldLeft) ? null : oldLeft;
    let oldTop = parseFloat(computedStyleMovedElement.top);
    oldTop = Number.isNaN(oldTop) ? null : oldTop;
    return { x: oldLeft, y: oldTop }
  }
  return { x: 0, y: 0 }
}

export function placeDesignItem(container: IDesignItem, designItem: IDesignItem, offset: IPoint, mode: 'position' | 'transform' | 'margin' | 'padding') {
  const movedElement = designItem.element;
  const computedStyleMovedElement = getComputedStyle(movedElement);

  if (mode === 'position') {
    let positionedContainerElement = container.element;
    let computedStylePositionedContainer = container.getComputedStyle();
    if (computedStylePositionedContainer.position !== 'relative' && computedStylePositionedContainer.position !== 'absolute' && (<HTMLElement>positionedContainerElement).offsetParent) {
      positionedContainerElement = (<HTMLElement>positionedContainerElement).offsetParent;
      computedStylePositionedContainer = container.window.getComputedStyle(positionedContainerElement);
    }

    let oldLeft = null;
    let oldRight = null;
    let oldTop = null;
    let oldBottom = null;

    let containerLeft = 0;
    let containerRight = 0;
    let containerTop = 0;
    let containerBottom = 0;

    let hasPositionedLayout = false;
    if (computedStyleMovedElement.position === 'relative' || computedStyleMovedElement.position === 'absolute') {
      oldLeft = parseFloat((<HTMLElement>movedElement).style.left);
      oldLeft = Number.isNaN(oldLeft) ? null : oldLeft;
      oldTop = parseFloat((<HTMLElement>movedElement).style.top);
      oldTop = Number.isNaN(oldTop) ? null : oldTop;
      oldRight = parseFloat((<HTMLElement>movedElement).style.right);
      oldRight = Number.isNaN(oldRight) ? null : oldRight;
      oldBottom = parseFloat((<HTMLElement>movedElement).style.bottom);
      oldBottom = Number.isNaN(oldBottom) ? null : oldBottom;
      hasPositionedLayout = true;
    } else {
      if (positionedContainerElement !== container.element) {
        let posContainerRect = getBoundingClientRectAlsoForDisplayContents(positionedContainerElement);
        let elementRect = getBoundingClientRectAlsoForDisplayContents(designItem.element);
        containerLeft = elementRect.left - posContainerRect.left;
        containerRight = elementRect.right - posContainerRect.right;
        containerTop = elementRect.top - posContainerRect.top;
        containerBottom = elementRect.bottom - posContainerRect.bottom;
      }
    }

    if (!hasPositionedLayout)
      designItem.setStyle('position', 'absolute');
    if (oldLeft || oldRight == null)
      designItem.setStyle('left', roundValue(designItem, offset.x + (oldLeft ?? 0) + containerLeft) + "px");
    if (oldTop || oldBottom == null)
      designItem.setStyle('top', roundValue(designItem, offset.y + (oldTop ?? 0) + containerTop) + "px");
    if (oldRight)
      designItem.setStyle('right', roundValue(designItem, (oldRight ?? 0) - offset.x + containerRight) + "px");
    if (oldBottom)
      designItem.setStyle('bottom', roundValue(designItem, (oldBottom ?? 0) - offset.y + containerBottom) + "px");
  }
}

export function roundValue(designItem: IDesignItem, value: number) {
  if (designItem.serviceContainer.options.roundPixelsToDecimalPlaces >= 0) {
    return value.toFixed(designItem.serviceContainer.options.roundPixelsToDecimalPlaces);
  }
  return value.toString();
}

/*function placeViaPosition(container: IDesignItem, designItem: IDesignItem, offset: IPoint, mode: 'position' | 'transform' | 'margin' | 'padding') {
  
}*/