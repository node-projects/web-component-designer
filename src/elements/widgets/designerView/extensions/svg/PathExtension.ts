import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import "../../../../helper/PathDataPolyfill";
import { IPoint } from '../../../../../interfaces/IPoint.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { EventNames } from '../../../../../enums/EventNames.js';
import { createPathD, PathData, PathDataL } from '../../../../helper/PathDataPolyfill.js';
import { ContextMenu } from '../../../../helper/contextMenu/ContextMenu.js';
import { IRect } from '../../../../../interfaces/IRect.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';


export class PathExtension extends AbstractExtension {

  private _lastPos: IPoint
  private _parentRect: DOMRect;
  private _startPos: IPoint;
  private _circlePos: IPoint;
  private _originalPathPoint: IPoint;
  private _pathdata: PathData[];
  private _offsetSvg = 10.0;
  private _pathElement: SVGPathElement;
  private _parentCoordinates: IRect;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(): void {
    this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
    this._pathdata = (<SVGGraphicsElement>this.extendedItem.node).getPathData({ normalize: false });
    this._pathElement = (<SVGPathElement>this.extendedItem.node);
    this._lastPos = { x: 0, y: 0 };
    for (let p of this._pathdata) {
      switch (p.type) {
        case 'M':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._lastPos = { x: p.values[0], y: p.values[1] };
          break;
        case 'm':
          this._drawPathCircle(p.values[0] + this._lastPos.x, p.values[1] + this._lastPos.y, p, 0);
          this._lastPos = { x: p.values[0] + this._lastPos.x, y: p.values[1] + this._lastPos.y };
          break;
        case 'L':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._lastPos = { x: p.values[0], y: p.values[1] };
          break;
        case 'l':
          this._drawPathCircle(p.values[0] + this._lastPos.x, p.values[1] + this._lastPos.y, p, 0);
          this._lastPos = { x: p.values[0] + this._lastPos.x, y: p.values[1] + this._lastPos.y };
          break;
        case 'H':
          this._drawPathCircle(p.values[0], this._lastPos.y, p, 0);
          this._lastPos = { x: p.values[0], y: this._lastPos.y };
          break;
        case 'h':
          this._drawPathCircle(p.values[0] + this._lastPos.x, this._lastPos.y, p, 0);
          this._lastPos = { x: p.values[0] + this._lastPos.x, y: this._lastPos.y };
          break;
        case 'V':
          this._drawPathCircle(this._lastPos.x, p.values[0], p, 0);
          this._lastPos = { x: this._lastPos.x, y: p.values[0] };
          break;
        case 'v':
          this._drawPathCircle(this._lastPos.x, p.values[0] + this._lastPos.y, p, 0);
          this._lastPos = { x: this._lastPos.x, y: p.values[0] + this._lastPos.y };
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
          this._lastPos = { x: p.values[4] + this._lastPos.x, y: p.values[5] + this._lastPos.y };
          break;
        case 'S':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[2], p.values[3], p, 2);
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(p.values[0], p.values[1], p.values[2], p.values[3]);
          this._lastPos = { x: p.values[2], y: p.values[3] };
          break;
        case 's':
          this._drawPathCircle(p.values[0] + this._lastPos.x, p.values[1] + this._lastPos.y, p, 0);
          this._drawPathCircle(p.values[2] + this._lastPos.x, p.values[3] + this._lastPos.y, p, 2);
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0] + this._lastPos.x, p.values[1] + this._lastPos.y);
          this._drawPathLine(p.values[0] + this._lastPos.x, p.values[1] + this._lastPos.y, p.values[2] + this._lastPos.x, p.values[3] + this._lastPos.y);
          this._lastPos = { x: p.values[2] + this._lastPos.x, y: p.values[3] + this._lastPos.y };
          break;
        case 'Q':
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(p.values[0], p.values[1], p.values[2], p.values[3]);
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[2], p.values[3], p, 2);
          this._lastPos = { x: p.values[2], y: p.values[3] };
          break;
        case 'T':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._lastPos = { x: p.values[0], y: p.values[1] };
          break;
        case 'A':
          this._drawPathCircle(p.values[0], p.values[1], p, 0);
          this._drawPathCircle(p.values[5], p.values[6], p, 5);
          this._lastPos = { x: p.values[0], y: p.values[1] };
          break;
      }
    }
  }

  pointerEvent(event: PointerEvent, circle: SVGCircleElement, p: PathData, index: number) {
    event.stopPropagation();
    const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);
    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._startPos = cursorPos
        this._circlePos = { x: parseFloat(circle.getAttribute("cx")), y: parseFloat(circle.getAttribute("cy")) }
        this._originalPathPoint = { x: p.values[index], y: p.values[index + 1] }
        this._parentCoordinates = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
        break;

      case EventNames.PointerMove:
        if (this._startPos && event.buttons > 0) {
          this._lastPos = { x: this._startPos.x, y: this._startPos.y };
          const cx = cursorPos.x - this._lastPos.x + this._circlePos.x;
          const cy = cursorPos.y - this._lastPos.y + this._circlePos.y;
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
            if (p.type == 'V' || p.type == 'v') {
              p.values[index] = this._originalPathPoint.x + dy;
              circle.setAttribute("cy", (this._circlePos.y + dy).toString());
            } else if (p.type == 'H' || p.type == 'h') {
              circle.setAttribute("cy", (this._circlePos.x + dx).toString());
            } else {
              circle.setAttribute("cx", (this._circlePos.x + dx).toString());
              circle.setAttribute("cy", (this._circlePos.y + dy).toString());
            }
          }
          this.designerCanvas.extensionManager.refreshAllExtensions([this.extendedItem], this);
          this.extendedItem.element.setAttribute("d", createPathD(this._pathdata));
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);

        this._startPos = null;
        this._circlePos = null;
        this._lastPos = null;
        this.extendedItem.setAttribute('d', createPathD(this._pathdata));

        if (getComputedStyle(this._pathElement.parentElement).position == "absolute") {
          let group = this.extendedItem.openGroup('rearrangeSvg');
          let dataPath = this._pathdata;
          this._rearrangeSvgElement();
          this._rearrangePointsFromElement(this._parentCoordinates, dataPath);
          group.commit();
        }
        break;
    }
  }

  _drawPathCircle(x: number, y: number, p: PathData, index: number) {
    let circle = this._drawCircle((this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x, (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y, 5 / this.designerCanvas.scaleFactor, 'svg-path');
    circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

    let circlePos = { x: x, y: y };
    const items: IContextMenuItem[] = [];
    const pidx = this._pathdata.indexOf(p);

    items.push({
      title: 'delete point', action: () => {
        this._pathdata.splice(pidx, 1);
        if (pidx == 0)
          this._pathdata[0].type = 'M';
        this.extendedItem.setAttribute('d', createPathD(this._pathdata));
      }
    });

    items.push({
      title: 'insert point after', action: () => {
        const l: PathDataL = { type: 'L', values: [p.values[0], p.values[1]] };
        this._pathdata.splice(pidx + 1, 0, <any>l);
        this.extendedItem.setAttribute('d', createPathD(this._pathdata));
      }
    });

    if (pidx != 0 && this._checkCircleIndex(p, circlePos)) {
      items.push({
        title: 'convert to quadratic bézier', action: () => {
          let p1x = this._pathdata[pidx - 1].values[0];
          let p1y = this._pathdata[pidx - 1].values[1];
          if (this._pathdata[pidx - 1].type === 'C') {
            p1x = this._pathdata[pidx - 1].values[4];
            p1y = this._pathdata[pidx - 1].values[5];
          }
          else if (this._pathdata[pidx - 1].type === 'Q') {
            p1x = this._pathdata[pidx - 1].values[2];
            p1y = this._pathdata[pidx - 1].values[3];
          }
          const p2x = this._pathdata[pidx].values[0];
          const p2y = this._pathdata[pidx].values[1];
          const mpx = (p2x + p1x) * 0.5;
          const mpy = (p2y + p1y) * 0.5;
          const theta = Math.atan2(p2y - p1y, p2x - p1x) - Math.PI / 2;
          const offset = 50;
          const c1x = mpx + offset * Math.cos(theta);
          const c1y = mpy + offset * Math.sin(theta);
          this._pathdata[pidx].type = 'Q';
          this._pathdata[pidx].values[0] = c1x;
          this._pathdata[pidx].values[1] = c1y;
          this._pathdata[pidx].values[2] = p2x;
          this._pathdata[pidx].values[3] = p2y;
          this.extendedItem.setAttribute('d', createPathD(this._pathdata));
        }
      });
    }

    if (pidx != 0 && this._checkCircleIndex(p, circlePos)) {
      items.push({
        title: 'convert to cubic bézier', action: () => {
          let p1x = this._pathdata[pidx - 1].values[0];
          let p1y = this._pathdata[pidx - 1].values[1];
          if (this._pathdata[pidx - 1].type === 'C') {
            p1x = this._pathdata[pidx - 1].values[4];
            p1y = this._pathdata[pidx - 1].values[5];
          }
          else if (this._pathdata[pidx - 1].type === 'Q') {
            p1x = this._pathdata[pidx - 1].values[2];
            p1y = this._pathdata[pidx - 1].values[3];
          }

          const p2x = this._pathdata[pidx].values[0];
          const p2y = this._pathdata[pidx].values[1];
          const mpx = (p2x + p1x) * 0.5;
          const mpy = (p2y + p1y) * 0.5;
          const theta = Math.atan2(p2y - p1y, p2x - p1x) - Math.PI / 2;
          const offset = 50;
          let c1x = mpx + offset * Math.cos(theta);
          let c1y = mpy + offset * Math.sin(theta);

          c1x = p.values[0] + 2 * (p1x - p.values[0]) / 3;
          c1y = p.values[1] + 2 * (p1y - p.values[1]) / 3;
          const c2x = x + 2 * (p1x - x) / 3;
          const c2y = y + 2 * (p1y - y) / 3;
          this._pathdata[pidx].type = 'C';
          this._pathdata[pidx].values[0] = c1x;
          this._pathdata[pidx].values[1] = c1y;
          this._pathdata[pidx].values[2] = c2x;
          this._pathdata[pidx].values[3] = c2y;
          this._pathdata[pidx].values[4] = p2x;
          this._pathdata[pidx].values[5] = p2y;
          this.extendedItem.setAttribute('d', createPathD(this._pathdata));
        }
      });
    }

    circle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event, circle, p, index));
    circle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event, circle, p, index));
    circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event, circle, p, index));
    circle.addEventListener(EventNames.ContextMenu, event => {
      event.preventDefault();
      ContextMenu.show(items, event);
    });
  }


  _drawPathLine(x1: number, y1: number, x2: number, y2: number) {
    this._drawLine((this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x1, (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y1, (this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x2, (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y2, 'svg-path-line');
  }


  _checkCircleIndex(p: PathData, circlePos: IPoint): boolean {
    switch (p.type) {
      case 'M':
      case 'L':
        if (p.values[0] == circlePos.x && p.values[1] == circlePos.y)
          return true;
        break;
      case 'Q':
        if (p.values[2] == circlePos.x && p.values[3] == circlePos.y)
          return true;
        break;
      case 'C':
        if (p.values[4] == circlePos.x && p.values[5] == circlePos.y)
          return true;
        break;
    }
    return false;
  }

  _rearrangeSvgElement() {
    let newElementCoords = (<SVGGeometryElement>this.extendedItem.element).getBoundingClientRect();
    let parentLeft = (newElementCoords.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor - this._offsetSvg;
    let parentTop = (newElementCoords.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - this._offsetSvg;
    let heightSvgElement = newElementCoords.height + (2 * this._offsetSvg);
    let widthSvgElement = newElementCoords.width + (2 * this._offsetSvg);
    (<SVGGeometryElement>this.extendedItem.element).parentElement.style.setProperty("left", parentLeft.toString() + "px");
    (<SVGGeometryElement>this.extendedItem.element).parentElement.style.setProperty("top", parentTop.toString() + "px");
    (<SVGGeometryElement>this.extendedItem.element).parentElement.style.setProperty("height", heightSvgElement.toString() + "px");
    (<SVGGeometryElement>this.extendedItem.element).parentElement.style.setProperty("width", widthSvgElement.toString() + "px");
  }

  _rearrangePointsFromElement(oldParentCoords: IRect, pathData: PathData[]) {
    let newParentCoords = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
    let diffX = oldParentCoords.x - newParentCoords.x;
    let diffY = oldParentCoords.y - newParentCoords.y;
    for (let i = 0; i < pathData.length; i++) {
      pathData[i].values[0] = pathData[i].values[0] + diffX;
      pathData[i].values[1] = pathData[i].values[1] + diffY;
    }
    this.extendedItem.element.setAttribute("d", createPathD(this._pathdata));
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}