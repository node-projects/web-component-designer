import { EventNames } from '../../../../enums/EventNames';
import { IDesignerMousePoint } from '../../../../interfaces/IDesignerMousePoint';
import { DesignItem } from '../../../item/DesignItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class MagicWandSelectorTool implements ITool {
  cursor: string = 'progress';

  private _pathD: string;
  private _path: SVGPathElement;
  private _initialPoint: IDesignerMousePoint;

  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerView.getDesignerMousepoint(event, currentElement, event.type === 'pointerdown' ? null : this._initialPoint);

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._path.setAttribute('class', 'svg-selector');
        this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        this._path.setAttribute("D", this._pathD);
        designerView.overlayLayer.appendChild(this._path);
        break;

      case EventNames.PointerMove:
        if (this._path) {
          this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
          this._path.setAttribute("d", this._pathD + "Z");
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);

        const elements = designerView.rootDesignItem.element.querySelectorAll('*');
        const inSelectionElements: IDesignItem[] = [];

        //@ts-ignore
        let point: { x: number, y: number } = designerView.overlayLayer.createSVGPoint();
        for (let e of elements) {
          let elementRect = e.getBoundingClientRect();
          point.x = elementRect.left - designerView.containerBoundingRect.left;
          point.y = elementRect.top - designerView.containerBoundingRect.top;
          const p1 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.left - designerView.containerBoundingRect.left + elementRect.width;
          point.y = elementRect.top - designerView.containerBoundingRect.top;
          const p2 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.left - designerView.containerBoundingRect.left;
          point.y = elementRect.top - designerView.containerBoundingRect.top + elementRect.height;
          const p3 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.left - designerView.containerBoundingRect.left + elementRect.width;
          point.y = elementRect.top - designerView.containerBoundingRect.top + elementRect.height;
          const p4 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          if (p1 && p2 && p3 && p4) {
            const desItem = DesignItem.GetOrCreateDesignItem(e, designerView.serviceContainer, designerView.instanceServiceContainer)
            inSelectionElements.push(desItem);
          }
        }

        designerView.overlayLayer.removeChild(this._path);
        this._path = null;
        this._pathD = null;

        designerView.instanceServiceContainer.selectionService.setSelectedElements(inSelectionElements);

        designerView.serviceContainer.globalContext.finishedWithTool(this);
        break;
    }
  }

  dispose(): void {
  }
}