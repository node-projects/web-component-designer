import { EventNames } from '../../../../enums/EventNames.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { hasCommandKey } from '../../../helper/KeyboardHelper.js';
import { DesignItem } from '../../../item/DesignItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';

export class RectangleSelectorTool implements ITool {
  cursor: string = 'progress';

  private _rect: SVGRectElement;
  private _initialPoint: IPoint;

  activated(serviceContainer: ServiceContainer) {
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    if (hasCommandKey(event) || event.shiftKey)
      this.cursor = 'copy';
    else if (event.altKey)
      this.cursor = 'default';
    else
      this.cursor = 'default';

    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        designerCanvas.captureActiveTool(this);

        this._initialPoint = currentPoint;
        if (!this._rect)
          this._rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._rect.setAttribute('class', 'svg-selector');
        this._rect.setAttribute('x', <string><any>(this._initialPoint.x * designerCanvas.scaleFactor));
        this._rect.setAttribute('y', <string><any>(this._initialPoint.y * designerCanvas.scaleFactor));
        this._rect.setAttribute('width', <string><any>0);
        this._rect.setAttribute('height', <string><any>0);
        this._rect.style.strokeWidth = '' + (1 / designerCanvas.scaleFactor);
        this._rect.style.strokeDasharray = '' + (2 / designerCanvas.scaleFactor);
        designerCanvas.overlayLayer.addOverlay(this.constructor.name, this._rect, OverlayLayer.Foreground);
        break;

      case EventNames.PointerMove:
        if (this._initialPoint) {
          let w = currentPoint.x - this._initialPoint.x;
          let h = currentPoint.y - this._initialPoint.y;
          if (w >= 0) {
            this._rect.setAttribute('x', <string><any>this._initialPoint.x);
            this._rect.setAttribute('width', <string><any>w);
          } else {
            this._rect.setAttribute('x', <string><any>currentPoint.x);
            this._rect.setAttribute('width', <string><any>(-1 * w));
          }
          if (h >= 0) {
            this._rect.setAttribute('y', <string><any>this._initialPoint.y);
            this._rect.setAttribute('height', <string><any>h);
          } else {
            this._rect.setAttribute('y', <string><any>currentPoint.y);
            this._rect.setAttribute('height', <string><any>(-1 * h));
          }
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerCanvas.releaseActiveTool();

        const elements = designerCanvas.rootDesignItem.querySelectorAll('*');
        let inSelectionElements: IDesignItem[] = [];

        if ((hasCommandKey(event) || event.shiftKey || event.altKey) && designerCanvas.instanceServiceContainer.selectionService.selectedElements)
          inSelectionElements.push(...designerCanvas.instanceServiceContainer.selectionService.selectedElements);

        let point = designerCanvas.overlayLayer.createPoint();
        for (let e of elements) {
          let elementRect = designerCanvas.getNormalizedElementCoordinates(e);
          point.x = elementRect.x;
          point.y = elementRect.y;
          const p1 = this._rect.isPointInFill(point);
          point.x = elementRect.x + elementRect.width;
          point.y = elementRect.y;
          const p2 = p1 && this._rect.isPointInFill(point);
          point.x = elementRect.x;
          point.y = elementRect.y + elementRect.height;
          const p3 = p2 && this._rect.isPointInFill(point);
          point.x = elementRect.x + elementRect.width;
          point.y = elementRect.y + elementRect.height;
          const p4 = p3 && this._rect.isPointInFill(point);
          if (p4) {
            const desItem = DesignItem.GetOrCreateDesignItem(e, e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
            if (!inSelectionElements.includes(desItem) && !event.altKey) {
              inSelectionElements.push(desItem);
            } else if (event.altKey) {
              const idx = inSelectionElements.indexOf(desItem);
              inSelectionElements.splice(idx, 1)
            }
          }
        }
        
        designerCanvas.overlayLayer.removeOverlay(this._rect);
        this._rect = null;
        this._initialPoint = null;

        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(inSelectionElements, event);

        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        break;
    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }

  dispose(): void {
  }
}