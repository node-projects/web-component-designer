import { EventNames } from '../../../../enums/EventNames';
import { IDesignerMousePoint } from '../../../../interfaces/IDesignerMousePoint';
import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

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

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        this._path.setAttribute("D", this._pathD);
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
        designerView.overlayLayer.removeChild(this._path);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._path.setAttribute("d", this._pathD);
        svg.appendChild(this._path);
        designerView.rootDesignItem.element.appendChild(svg);
        this._path = null;
        this._pathD = null;

        //TODO: Better Path drawing (like in SVGEDIT & Adding via Undo Framework. And adding to correct container)
        
        break;
    }
  }
}