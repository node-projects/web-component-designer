import { EventNames } from '../../../../enums/EventNames.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { calculateNormLegth } from '../../../helper/PathDataPolyfill.js';
import { applySvgDrawingStyle, insertSvgDrawing } from './SvgDrawingHelper.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { hasCommandKey } from '../../../helper/KeyboardHelper.js';
import { roundValueToDecimalPlaces } from '../extensions/svg/geometry/GeometryWriteHelper.js';

export class DrawRectTool implements ITool {

  readonly cursor = 'crosshair';

  private _path: SVGRectElement;
  private _startPoint: IPoint;
  private _canvas: IDesignerCanvas;
  private _capture: Element;
  private _pointerId: number;
  private _minX: number;
  private _minY: number;
  private _maxX: number;
  private _maxY: number;
  private _px: number;
  private _py: number;

  constructor() {
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
    if (this._path) this._canvas?.overlayLayer.removeOverlay(this._path);
    if (this._capture?.hasPointerCapture(this._pointerId)) this._capture.releasePointerCapture(this._pointerId);
    this._canvas?.releaseActiveTool();
    this._path = null;
    this._capture = null;
    this._canvas = null;
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);
    const offset = 10;


    switch (event.type) {
      case EventNames.PointerDown:
        if (event.button !== 0) return;
        this._canvas = designerCanvas;
        this._capture = event.target as Element;
        this._pointerId = event.pointerId;
        this._startPoint = currentPoint;
        (<Element>event.target).setPointerCapture(event.pointerId);
        designerCanvas.captureActiveTool(this);

        this._path = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("fill", designerCanvas.serviceContainer.globalContext.fillBrush);
        this._path.setAttribute("stroke-width", designerCanvas.serviceContainer.globalContext.strokeThickness);
        this._path.setAttribute("x", currentPoint.x.toString());
        this._path.setAttribute("y", currentPoint.y.toString());
        this._path.setAttribute("width", "0");
        this._path.setAttribute("height", "0");

        applySvgDrawingStyle(this._path, designerCanvas.serviceContainer.globalContext);
        designerCanvas.overlayLayer.addOverlay(this.constructor.name, this._path, OverlayLayer.Foreground);
        break;


      case EventNames.PointerMove:
        if (this._path) {
          this._minX = currentPoint.x < this._startPoint.x ? currentPoint.x : this._startPoint.x;
          this._maxX = currentPoint.x > this._startPoint.x ? currentPoint.x : this._startPoint.x;
          this._minY = currentPoint.y < this._startPoint.y ? currentPoint.y : this._startPoint.y;
          this._maxY = currentPoint.y > this._startPoint.y ? currentPoint.y : this._startPoint.y;

          if (hasCommandKey(event)) {
            if (event.shiftKey) {
              const normLength = 2 * calculateNormLegth(this._startPoint, currentPoint);
              this._px = this._startPoint.x - normLength / 2;
              this._py = this._startPoint.y - normLength / 2;
              this._path.setAttribute("width", (normLength).toString());
              this._path.setAttribute("height", (normLength).toString());
            }
            else {
              const w = 2 * (this._maxX - this._minX);
              const h = 2 * (this._maxY - this._minY);
              this._px = currentPoint.x < this._startPoint.x ? currentPoint.x : this._startPoint.x - w / 2;
              this._py = currentPoint.y < this._startPoint.y ? currentPoint.y : this._startPoint.y - h / 2;
              this._path.setAttribute("width", (w).toString());
              this._path.setAttribute("height", (h).toString());
            }
            this._path.setAttribute("x", this._px.toString());
            this._path.setAttribute("y", this._py.toString());
          }
          else {
            if (event.shiftKey) {
              const normLength = calculateNormLegth(this._startPoint, currentPoint);
              this._px = currentPoint.x < this._startPoint.x ? this._startPoint.x - normLength : this._startPoint.x;
              this._py = currentPoint.y < this._startPoint.y ? this._startPoint.y - normLength : this._startPoint.y;
              this._path.setAttribute("width", (normLength).toString());
              this._path.setAttribute("height", (normLength).toString());
            }
            else {
              this._px = currentPoint.x < this._startPoint.x ? currentPoint.x : this._startPoint.x;
              this._py = currentPoint.y < this._startPoint.y ? currentPoint.y : this._startPoint.y;
              this._path.setAttribute("width", (this._maxX - this._minX).toString());
              this._path.setAttribute("height", (this._maxY - this._minY).toString());
            }
            this._path.setAttribute("x", this._px.toString());
            this._path.setAttribute("y", this._py.toString());
          }
        }
        break;


      case 'pointercancel':
        this.dispose();
        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        return;
      case EventNames.PointerUp:
        if (!this._path) return;
        if (!this._path.getBBox().width && !this._path.getBBox().height) {
          this.dispose();
          designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
          return;
        }
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerCanvas.releaseActiveTool();

        let coords = designerCanvas.getNormalizedElementCoordinates(this._path);
        designerCanvas.overlayLayer.removeOverlay(this._path);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const mvX = coords.x - offset;
        const mvY = coords.y - offset;
        const decimalPlaces = designerCanvas.serviceContainer.options.roundPixelsToDecimalPlaces;
        this._path.setAttribute("x", roundValueToDecimalPlaces(this._px - mvX, decimalPlaces));
        this._path.setAttribute("y", roundValueToDecimalPlaces(this._py - mvY, decimalPlaces));
        this._path.setAttribute("width", roundValueToDecimalPlaces(Number(this._path.getAttribute("width")), decimalPlaces));
        this._path.setAttribute("height", roundValueToDecimalPlaces(Number(this._path.getAttribute("height")), decimalPlaces));
        this._path.removeAttribute("stroke");
        this._path.removeAttribute("stroke-width");
        this._path.removeAttribute("overlay-source");
        this._path.removeAttribute("style");
        this._path.removeAttribute("fill");
        svg.appendChild(this._path);
        svg.style.left = roundValueToDecimalPlaces(mvX, decimalPlaces) + 'px';
        svg.style.top = roundValueToDecimalPlaces(mvY, decimalPlaces) + 'px';
        svg.style.position = 'absolute';
        svg.style.width = Math.round(coords.width + 2 * offset) + 'px';
        svg.style.height = Math.round(coords.height + 2 * offset) + 'px';
        svg.style.overflow = 'visible';
        svg.style.stroke = designerCanvas.serviceContainer.globalContext.strokeColor;
        svg.style.strokeWidth = designerCanvas.serviceContainer.globalContext.strokeThickness;
        this._path = null;
        applySvgDrawingStyle(svg, designerCanvas.serviceContainer.globalContext);
        insertSvgDrawing(designerCanvas, svg);
        this.dispose();
        break;
    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) {
    if (event.type === 'keydown' && event.key === 'Escape') {
      this.dispose();
      designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
      event.preventDefault();
    }
  }
}
