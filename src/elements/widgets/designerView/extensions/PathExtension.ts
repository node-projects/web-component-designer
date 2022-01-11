import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import "../../../helper/PathDataPolyfill";
import { IPoint } from "../../../../interfaces/IPoint";
import { IExtensionManager } from "./IExtensionManger";
import { EventNames } from "../../../../enums/EventNames";
import { PathData } from "../../../helper/PathDataPolyfill";

export class PathExtension extends AbstractExtension {
  //private _itemRect: DOMRect;
  //private _svgRect: DOMRect;
  private _lastPos: IPoint
  private _parentRect: DOMRect;
  private _startPos: IPoint;
  private _circlePos: IPoint;
  private _originalPathPoint: IPoint;
  private _pathdata: PathData[];

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(): void {
    //this._itemRect = this.extendedItem.element.getBoundingClientRect();
    //this._svgRect = (<SVGGeometryElement>this.extendedItem.element).ownerSVGElement.getBoundingClientRect();
    this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
    this._pathdata = (<SVGGraphicsElement>this.extendedItem.node).getPathData({ normalize: true });
    for (let p of this._pathdata) {
      switch (p.type) {
        case 'M':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._lastPos = { x: p.values[0], y: p.values[1] };
          break;
        case 'L':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          break;
        case 'H':
          break;
        case 'V':
          break;
        case 'Z':
          break;
        case 'C':
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(p.values[4], p.values[5], p.values[2], p.values[3]);
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[2], p.values[3], p, 2);
          this._drawPathCircle(p.values[4], p.values[5], p, 4);
          this._lastPos = { x: p.values[4], y: p.values[5] };
          break;
        case 'c':
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(this._lastPos.x + p.values[4], this._lastPos.y + p.values[5], p.values[2], p.values[3]);
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[2], p.values[3], p, 2);
          this._drawPathCircle(this._lastPos.x + p.values[4], this._lastPos.y + p.values[5], p, 4);
          this._lastPos = { x: p.values[4], y: p.values[5] };
          break;
        case 'S':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[2], p.values[3], p, 2);
          break;
        case 'Q':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[2], p.values[3], p, 2);
          break;
        case 'T':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          break;
        case 'A':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[5], p.values[6], p, 5);
          break;
      }
    }
  }

  pointerEvent(event: PointerEvent, circle: SVGCircleElement, p: PathData, index: number) {
    event.stopPropagation();

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._startPos = { x: event.x, y: event.y };
        this._circlePos = { x: parseFloat(circle.getAttribute("cx")), y: parseFloat(circle.getAttribute("cy")) }
        this._originalPathPoint = { x: p.values[index], y: p.values[index + 1] }


        break;

      case EventNames.PointerMove:
        if (this._startPos && event.buttons > 0) {
          this._lastPos = { x: this._startPos.x, y: this._startPos.y };
          const cx = event.x - this._lastPos.x + this._circlePos.x;
          const cy = event.y - this._lastPos.y + this._circlePos.y;
          const dx = cx - this._circlePos.x;
          const dy = cy - this._circlePos.y;
          if (event.shiftKey) {
            if (Math.abs(dx) >= Math.abs(dy)) {
              p.values[index] = this._originalPathPoint.x + dx;
              circle.setAttribute("cx", (this._circlePos.x + dx).toString());
              p.values[index + 1] = this._originalPathPoint.y;
              circle.setAttribute("cy", (this._circlePos.y).toString());
            }
            else {
              p.values[index] = this._originalPathPoint.x;
              circle.setAttribute("cx", (this._circlePos.x).toString());
              p.values[index + 1] = this._originalPathPoint.y + dy;
              circle.setAttribute("cy", (this._circlePos.y + dy).toString());
            }
          }
          else {
            p.values[index] = this._originalPathPoint.x + dx;
            p.values[index + 1] = this._originalPathPoint.y + dy;
            circle.setAttribute("cx", (this._circlePos.x + dx).toString());
            circle.setAttribute("cy", (this._circlePos.y + dy).toString());
          }
          this.extendedItem.element.setAttribute("d", this._drawPath(this._pathdata, index));
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        this._startPos = null;
        this._circlePos = null;
        this._lastPos = null;
        this.extendedItem.setAttribute('d', this._drawPath(this._pathdata, index));
        break;
    }
  }

  _drawPath(path: PathData[], index: number) {
    let pathD: string = "";
    for (let p of path) {
      switch (p.type) {
        case 'M':
          pathD += p.type + p.values[0] + " " + p.values[1];
          break;
        case 'L':
          pathD += p.type + p.values[0] + " " + p.values[1];
          break;
        case 'H':

          break;
        case 'V':

          break;
        case 'Z':

          break;
        case 'C':
        case 'c':
          pathD += p.type + p.values[0] + " " + p.values[1] + " " + p.values[2] + " " + p.values[3] + " " + p.values[4] + " " + p.values[5];
          break;
        case 'S':

          break;
        case 'Q':

          break;
        case 'T':

          break;
        case 'A':

          break;
      }
    }
    return pathD;
    console.log(pathD);
  }

  _drawPathCircle(x: number, y: number, p: PathData, index: number) {
    let circle = this._drawCircle(this._parentRect.x - this.designerCanvas.containerBoundingRect.x + x, this._parentRect.y - this.designerCanvas.containerBoundingRect.y + y, 3, 'svg-path');
    circle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event, circle, p, index));
    circle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event, circle, p, index));
    circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event, circle, p, index));
  }

  _drawPathLine(x1: number, y1: number, x2: number, y2: number) {
    this._drawLine(this._parentRect.x - this.designerCanvas.containerBoundingRect.x + x1, this._parentRect.y - this.designerCanvas.containerBoundingRect.y + y1, this._parentRect.x - this.designerCanvas.containerBoundingRect.x + x2, this._parentRect.y - this.designerCanvas.containerBoundingRect.y + y2, 'svg-path-line');
  }

  _drawHelpLine(pStart: IPoint, pEnd: IPoint) {
    let line: SVGLineElement;
    line.setAttribute("stroke", "yellow");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("x1", pStart.x.toString());
    line.setAttribute("y1", pStart.y.toString());
    line.setAttribute("x2", pEnd.x.toString());
    line.setAttribute("y2", pEnd.y.toString());
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}