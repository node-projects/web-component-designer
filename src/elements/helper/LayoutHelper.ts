//todo
//this function should return the correct property to change a layout, for example left/right when left or right is used,
//maybe margin on grid? or transform??

import { IPoint } from "../../interfaces/IPoint.js";
import { IDesignItem } from "../item/IDesignItem.js";

export function placeDesignItem(container: IDesignItem, designItem: IDesignItem, offset: IPoint, mode: 'position' | 'transform' | 'margin' | 'padding') {
  const movedElement = designItem.element;
  const computedStyleMovedElement = getComputedStyle(movedElement);

  if (mode === 'position') {
    let positionedContainerElement = container.element;
    let computedStylePositionedContainer = getComputedStyle(container.element);
    while (computedStylePositionedContainer.position !== 'relative' && computedStylePositionedContainer.position !== 'absolute') {
      positionedContainerElement = positionedContainerElement.parentElement;
      computedStylePositionedContainer = getComputedStyle(positionedContainerElement);
    }

    let oldLeft = null;
    let oldRight = null;
    let oldTop = null;
    let oldBottom = null;

    let containerLeft = 0;
    //@ts-ignore
    let containerRight = 0;
    let containerTop = 0;
    //@ts-ignore
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
        let posContainerRect = positionedContainerElement.getBoundingClientRect();
        let elementRect = designItem.element.getBoundingClientRect();
        containerLeft = elementRect.left - posContainerRect.left;
        containerRight = elementRect.right - posContainerRect.right;
        containerTop = elementRect.top - posContainerRect.top;
        containerBottom = elementRect.bottom - posContainerRect.bottom;
      }
    }

    if (!hasPositionedLayout)
      (<HTMLElement>designItem.element).style.transform = designItem.styles.get('transform') ?? '';
    designItem.setStyle('position', 'absolute');
    designItem.setStyle('left', (offset.x + oldLeft + containerLeft) + "px");
    designItem.setStyle('top', (offset.y + oldTop + containerTop) + "px");
  }
}

/*function placeViaPosition(container: IDesignItem, designItem: IDesignItem, offset: IPoint, mode: 'position' | 'transform' | 'margin' | 'padding') {
  
}*/