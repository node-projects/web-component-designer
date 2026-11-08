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

export class DrawEllipsisTool implements ITool {

  readonly cursor = 'crosshair';

  private _path: SVGEllipseElement;
  private _startPoint: IPoint;
  private _canvas: IDesignerCanvas;
  private _capture: Element;
  private _pointerId: number;
  private _radius: IPoint;
  private _cx: number;
  private _cy: number;

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

        this._path = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("fill", designerCanvas.serviceContainer.globalContext.fillBrush);
        this._path.setAttribute("stroke-width", designerCanvas.serviceContainer.globalContext.strokeThickness);
        this._path.setAttribute("cx", currentPoint.x.toString());
        this._path.setAttribute("cy", currentPoint.y.toString());
        this._path.setAttribute("rx", "0");
        this._path.setAttribute("ry", "0");
        applySvgDrawingStyle(this._path, designerCanvas.serviceContainer.globalContext);
        designerCanvas.overlayLayer.addOverlay(this.constructor.name, this._path, OverlayLayer.Foreground);
        break;


      case EventNames.PointerMove:
        if (this._path) {
          this._radius = { x: Math.abs(currentPoint.x - this._startPoint.x), y: Math.abs(currentPoint.y - this._startPoint.y) }

          if (hasCommandKey(event)) {
            this._path.setAttribute("cx", this._startPoint.x.toString());
            this._path.setAttribute("cy", this._startPoint.y.toString());
            this._cx = this._startPoint.x;
            this._cy = this._startPoint.y;
            if (event.shiftKey) {
              const radius = calculateNormLegth(this._startPoint, currentPoint);
              this._path.setAttribute("rx", radius.toString());
              this._path.setAttribute("ry", radius.toString());
            }
            else {
              this._path.setAttribute("rx", this._radius.x.toString());
              this._path.setAttribute("ry", this._radius.y.toString());
            }
          }
          else {
            if (event.shiftKey) {
              const radius = calculateNormLegth(this._startPoint, currentPoint);
              this._radius = { x: radius, y: radius };
            }
            this._cx = currentPoint.x < this._startPoint.x ? this._startPoint.x - this._radius.x / 2 : this._startPoint.x + this._radius.x / 2;
            this._cy = currentPoint.y < this._startPoint.y ? this._startPoint.y - this._radius.y / 2 : this._startPoint.y + this._radius.y / 2;
            this._path.setAttribute("cx", this._cx.toString());
            this._path.setAttribute("cy", this._cy.toString());
            this._path.setAttribute("rx", (this._radius.x / 2).toString());
            this._path.setAttribute("ry", (this._radius.y / 2).toString());
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
        svg.appendChild(this._path);
        this._path.setAttribute("cx", roundValueToDecimalPlaces(this._cx - mvX, decimalPlaces));
        this._path.setAttribute("cy", roundValueToDecimalPlaces(this._cy - mvY, decimalPlaces));
        this._path.setAttribute("rx", roundValueToDecimalPlaces(Number(this._path.getAttribute("rx")), decimalPlaces));
        this._path.setAttribute("ry", roundValueToDecimalPlaces(Number(this._path.getAttribute("ry")), decimalPlaces));
        this._path.removeAttribute("stroke");
        this._path.removeAttribute("stroke-width");
        this._path.removeAttribute("overlay-source");
        this._path.removeAttribute("style");
        this._path.removeAttribute("fill");
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
