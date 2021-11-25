import { EventNames } from '../../../../enums/EventNames';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { DesignItem } from '../../../item/DesignItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class RectangleSelectorTool implements ITool {
  cursor: string = 'progress';

  private _rect: SVGRectElement;
  private _initialPoint: IPoint;

  activated(serviceContainer: ServiceContainer) {
  }
  
  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        if (!this._rect)
          this._rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._rect.setAttribute('class', 'svg-selector');
        this._rect.setAttribute('x', <string><any>this._initialPoint.x);
        this._rect.setAttribute('y', <string><any>this._initialPoint.y);
        this._rect.setAttribute('width', <string><any>0);
        this._rect.setAttribute('height', <string><any>0);
        designerCanvas.overlayLayer.addOverlay(this._rect, OverlayLayer.Foregorund);
        break;

      case EventNames.PointerMove:
        if (this._initialPoint) {
          console.warn(currentPoint)
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

        const elements = designerCanvas.rootDesignItem.element.querySelectorAll('*');
        const inSelectionElements: IDesignItem[] = [];

        let point = designerCanvas.overlayLayer.createPoint();
        for (let e of elements) {
          let elementRect = e.getBoundingClientRect();
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top;
          const p1 = this._rect.isPointInFill(point);
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left + elementRect.width;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top;
          const p2 = p1 && this._rect.isPointInFill(point);
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top + elementRect.height;
          const p3 = p2 && this._rect.isPointInFill(point);
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left + elementRect.width;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top + elementRect.height;
          const p4 = p3 && this._rect.isPointInFill(point);
          if (p4) {
            const desItem = DesignItem.GetOrCreateDesignItem(e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer)
            inSelectionElements.push(desItem);
          }
        }

        designerCanvas.overlayLayer.removeOverlay(this._rect);
        this._rect = null;
        this._initialPoint = null;

        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(inSelectionElements);

        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        break;
    }
  }

  dispose(): void {
  }
}