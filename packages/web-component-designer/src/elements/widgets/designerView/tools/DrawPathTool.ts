import { EventNames } from '../../../../enums/EventNames.js';
import { moveSVGPath, straightenLine } from '../../../helper/PathDataPolyfill.js';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';
import { DesignItem } from '../../../item/DesignItem.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { DesignerCanvas } from '../designerCanvas.js';

const offset = 10;

type optionsType = {
  angleStep?: number; // if true, lines will be straightened to the nearest angle defined by angleStep,
  strokeColor?: string,
  fillBrush?: string,
  strokeThickness?: string
}

export class DrawPathTool implements ITool {

  readonly cursor = 'crosshair';

  private _pathD?: string;
  private _path?: SVGPathElement;
  private _samePoint = false;
  private _p2pMode = false;
  private _dragMode = false;
  private _pointerMoved = false;
  private _eventStarted = false;
  private _lastPoint?: IPoint;
  private _startPoint?: IPoint;
  private _captureElement?: Element;
  private _pointerId?: number;
  private _angleStep?: number;

  constructor(private options?: optionsType) {
    if (options?.angleStep !== undefined) {
      this._angleStep = options.angleStep;
    }
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        (<DesignerCanvas>designerCanvas).clickOverlay.focus();
        this._eventStarted = true;

        if (!this._p2pMode) {
          this._captureElement = event.target as Element;
          this._pointerId = event.pointerId;
          this._captureElement.setPointerCapture(this._pointerId);
          designerCanvas.captureActiveTool(this);

          this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          this._pathD = "M " + currentPoint.x + " " + currentPoint.y + " ";
          this._path.setAttribute("d", this._pathD);
          this._path.setAttribute("stroke", this.options?.strokeColor ?? designerCanvas.serviceContainer.globalContext.strokeColor);
          this._path.setAttribute("fill", this.options?.fillBrush ?? designerCanvas.serviceContainer.globalContext.fillBrush);
          this._path.setAttribute("stroke-width", this.options?.strokeThickness ?? designerCanvas.serviceContainer.globalContext.strokeThickness);
          designerCanvas.overlayLayer.addOverlay(this.constructor.name, this._path, OverlayLayer.Foreground);
          this._startPoint = currentPoint;
        }

        if (this._lastPoint != null && this._lastPoint.x === currentPoint.x && this._lastPoint.y === currentPoint.y && !this._samePoint) {
          this._samePoint = true;
        }
        if (this._lastPoint == null) {
          this._lastPoint = currentPoint;
        }
        if (this._startPoint == null) {
          this._startPoint = currentPoint;
        }
        break;


      case EventNames.PointerMove:
        if (this._eventStarted) {
          this._pointerMoved = true;
        }
        if (!this._p2pMode) {
          this._dragMode = true;
          if (this._path) {
            this._pathD += "L " + currentPoint.x + " " + currentPoint.y + " ";
            this._path.setAttribute("d", this._pathD!);
          }
        } else {  // shows line preview
          if (this._path) {
            let straightLine = currentPoint;
            if (event.shiftKey || this._angleStep) {
              straightLine = straightenLine(this._lastPoint!, currentPoint, this._angleStep ?? 45);
            }
            this._path.setAttribute("d", this._pathD + "L " + straightLine.x + " " + straightLine.y) + " ";
          }
        }
        break;


      case EventNames.PointerUp:
        if (this._eventStarted && !this._pointerMoved) {
          this._p2pMode = true;
        }
        if (this._p2pMode && !this._samePoint && this._startPoint!.x != currentPoint.x && this._startPoint!.y != currentPoint.y) {
          if (this._path) {
            if (event.shiftKey || this._angleStep) {
              let straightLine = straightenLine(this._lastPoint!, currentPoint, this._angleStep ?? 45);
              this._pathD += "L " + straightLine.x + " " + straightLine.y + " ";
              this._path.setAttribute("d", this._pathD!);
              this._lastPoint = straightLine;
            }
            else {
              this._pathD += "L " + currentPoint.x + " " + currentPoint.y + " ";
              this._path.setAttribute("d", this._pathD!);
              this._lastPoint = currentPoint;
            }
          }
        }

        if (this._samePoint && this._p2pMode || this._dragMode && !this._p2pMode) {
          this._finalizePath(designerCanvas);
        }
        //TODO: Better Path drawing (like in SVGEDIT & Adding via Undo Framework. And adding to correct container)
        break;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement?: Element) {
    if (event.key === "Escape") {
      this._finalizePath(designerCanvas);
    }
  }

  private _finalizePath(designerCanvas: IDesignerCanvas) {
    this._captureElement?.releasePointerCapture(this._pointerId!);
    this._captureElement = undefined;
    designerCanvas.releaseActiveTool();

    this._eventStarted = false;
    this._p2pMode = false;
    this._pointerMoved = false;
    this._samePoint = false;
    this._dragMode = false;

    let coords = designerCanvas.getNormalizedElementCoordinates(this._path!);
    designerCanvas.overlayLayer.removeOverlay(this._path!);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const mvX = coords.x - offset;
    const mvY = coords.y - offset;

    this._path!.setAttribute("d", this._pathD!);
    const d = moveSVGPath(this._path!, mvX, mvY);
    this._path!.setAttribute("d", d);
    this._path!.removeAttribute("stroke");
    this._path!.removeAttribute("stroke-width");
    this._path!.removeAttribute("overlay-source");
    svg.appendChild(this._path!);
    svg.style.left = (mvX) + 'px';
    svg.style.top = (mvY) + 'px';
    svg.style.position = 'absolute';
    svg.style.width = Math.round(coords.width + 2 * offset) + 'px';
    svg.style.height = Math.round(coords.height + 2 * offset) + 'px';
    svg.style.overflow = 'visible';
    svg.style.stroke = this.options?.strokeColor ?? designerCanvas.serviceContainer.globalContext.strokeColor;
    svg.style.fill = this.options?.fillBrush ?? designerCanvas.serviceContainer.globalContext.fillBrush;
    svg.style.strokeWidth = this.options?.strokeThickness ?? designerCanvas.serviceContainer.globalContext.strokeThickness;

    //designerView.rootDesignItem.element.appendChild(svg);
    this._path = undefined;
    this._pathD = undefined;
    this._lastPoint = undefined;

    const di = DesignItem.createDesignItemFromInstance(svg, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
    designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
    designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
  }

}