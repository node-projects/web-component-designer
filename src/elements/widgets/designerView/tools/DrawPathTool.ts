import { EventNames } from '../../../../enums/EventNames';
import { IDesignerMousePoint } from '../../../../interfaces/IDesignerMousePoint';
import { movePathData } from '../../../helper/PathDataPolyfill';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction';
import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';
import { DesignItem } from '../../../item/DesignItem';

export class DrawPathTool implements ITool {

  readonly cursor = 'crosshair';

  private _pathD: string;
  private _path: SVGPathElement;
  private _initialPoint: IDesignerMousePoint;

  constructor() {
  }

  dispose(): void {
  }

  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerView.getDesignerMousepoint(event, currentElement, event.type === 'pointerdown' ? null : this._initialPoint);

    const offset = 50;

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        this._path.setAttribute("D", this._pathD);
        this._path.setAttribute("stroke", designerView.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("fill", designerView.serviceContainer.globalContext.fillBrush);
        designerView.overlayLayer.appendChild(this._path);
        break;

      case EventNames.PointerMove:
        if (this._path) {
          this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
          this._path.setAttribute("d", this._pathD);
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        const rect = this._path.getBoundingClientRect();

        designerView.overlayLayer.removeChild(this._path);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        const mvX = rect.x - designerView.containerBoundingRect.x - offset;
        const mvY = rect.y - designerView.containerBoundingRect.y - offset;
        const d = movePathData(this._path, mvX, mvY);
        this._path.setAttribute("d", d);
        svg.appendChild(this._path);
        svg.style.left = (mvX) + 'px';
        svg.style.top = (mvY) + 'px';
        svg.style.position = 'absolute';
        svg.style.width = (rect.width + 2 * offset) + 'px';
        svg.style.height = (rect.height + 2 * offset) + 'px';
        //designerView.rootDesignItem.element.appendChild(svg);
        this._path = null;
        this._pathD = null;

        const di = DesignItem.createDesignItemFromInstance(svg, designerView.serviceContainer, designerView.instanceServiceContainer);
        designerView.instanceServiceContainer.undoService.execute(new InsertAction(designerView.rootDesignItem, designerView.rootDesignItem.childCount, di));

        designerView.serviceContainer.globalContext.finishedWithTool(this);
        //TODO: Better Path drawing (like in SVGEDIT & Adding via Undo Framework. And adding to correct container)

        break;
    }
  }
}