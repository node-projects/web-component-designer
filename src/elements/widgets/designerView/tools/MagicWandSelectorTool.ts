import { EventNames } from '../../../../enums/EventNames';
import { IDesignerMousePoint } from '../../../../interfaces/IDesignerMousePoint';
import { DesignItem } from '../../../item/DesignItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class MagicWandSelectorTool implements ITool {
  cursor: string = 'progress';

  private _pathD: string;
  private _path: SVGPathElement;
  private _initialPoint: IDesignerMousePoint;

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getDesignerMousepoint(event, currentElement, event.type === 'pointerdown' ? null : this._initialPoint);

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._path.setAttribute('class', 'svg-selector');
        this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        this._path.setAttribute("D", this._pathD);
        designerCanvas.overlayLayer.addOverlay(this._path, OverlayLayer.Foregorund);
        break;

      case EventNames.PointerMove:
        if (this._path) {
          this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
          this._path.setAttribute("d", this._pathD + "Z");
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);

        const elements = designerCanvas.rootDesignItem.element.querySelectorAll('*');
        const inSelectionElements: IDesignItem[] = [];

        let point: DOMPointInit = designerCanvas.overlayLayer.createPoint();
        for (let e of elements) {
          let elementRect = e.getBoundingClientRect();
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top;
          const p1 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left + elementRect.width;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top;
          const p2 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top + elementRect.height;
          const p3 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.left - designerCanvas.containerBoundingRect.left + elementRect.width;
          point.y = elementRect.top - designerCanvas.containerBoundingRect.top + elementRect.height;
          const p4 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          if (p1 && p2 && p3 && p4) {
            const desItem = DesignItem.GetOrCreateDesignItem(e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer)
            inSelectionElements.push(desItem);
          }
        }

        designerCanvas.overlayLayer.removeOverlay(this._path);
        this._path = null;
        this._pathD = null;

        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(inSelectionElements);

        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        break;
    }
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }
}