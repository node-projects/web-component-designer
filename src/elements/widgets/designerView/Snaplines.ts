import { IDesignItem } from "../../item/IDesignItem";
import { DomHelper } from "../../helper/DomHelper";
import { IPoint } from "../../../interfaces/IPoint";

export class Snaplines {

  public snapOffset = 10;

  private _svg: SVGElement;
  private _containerItem: IDesignItem;
  private _positionsH: Map<number, DOMRect[]> = new Map();
  private _positionsMiddleH: Map<number, DOMRect[]> = new Map();
  private _outerRect: DOMRect;
  private _lastPh: DOMRect[];

  constructor(svg: SVGElement) {
    this._svg = svg;
  }

  initialize(containerItem: IDesignItem) {
    //add snapline layer, add svg for snaplines
    this._containerItem = containerItem;
  }

  clearSnaplines() {
    DomHelper.removeAllChildnodes(this._svg);
    this._positionsH.clear();
    this._positionsMiddleH.clear();
  }

  calculateSnaplines(ignoredItems: IDesignItem[]) {
    this.clearSnaplines();
    let ignMap = new Map<Element, IDesignItem>(ignoredItems.map(i => [i.element, i]));
    this._outerRect = this._containerItem.element.getBoundingClientRect();
    for (let n of DomHelper.getAllChildNodes(this._containerItem.element)) {
      if (!ignMap.has(<Element>n)) {
        let p = (<Element>n).getBoundingClientRect();

        let pLeft = p.left - this._outerRect.x;
        let pMidH = p.left - this._outerRect.x + (p.width / 2)
        let pRight = p.left - this._outerRect.x + p.width;
        if (!this._positionsH.has(pLeft))
          this._positionsH.set(pLeft, []);
        this._positionsH.get(pLeft).push(p);
        if (!this._positionsH.has(pRight))
          this._positionsH.set(pRight, []);
        this._positionsH.get(pRight).push(p);
        if (!this._positionsMiddleH.has(pMidH))
          this._positionsMiddleH.set(pMidH, []);
        this._positionsMiddleH.get(pMidH).push(p);
      }
    }
  }

  //return the snapped position
  snapToPosition(position: IPoint, moveDirection: IPoint): IPoint {
    let pH = this._positionsH.get(position.x);
    let posH = position.x;
    if (pH === undefined) {
      for (let i = 1; i <= this.snapOffset; i++) {
        let pSmall = this._positionsH.get(position.x - i);
        let pBig = this._positionsH.get(position.x + i);
        if (pSmall !== null && pBig !== null) {
          if (moveDirection.x > 0) {
            pH = pBig;
            posH = position.x + i;
          } else {
            pH = pSmall;
            posH = position.x - i;
          }
        } else {
          pH = pBig ? pBig : pSmall;
          posH = pBig ? position.x + i : position.x - i;
        }
        if (pH)
          break;
      }
    }

    if (pH !== undefined) {
      let pos = { x: posH, y: position.y };
      if (this._lastPh !== pH)
        this.drawSnaplines(pos, pH);
      this._lastPh = pH;
      return pos;
    }

    if (this._lastPh !== undefined) {
      DomHelper.removeAllChildnodes(this._svg);
      this._lastPh = undefined;
    }
    return position;
  }

  //draw snaplines at position (if there are any)
  drawSnaplines(position: IPoint, rects: DOMRect[]) {
    DomHelper.removeAllChildnodes(this._svg);
    let minY = position.y;
    let maxY = position.y;
    for (const r of rects) {
      minY = minY < r.y ? minY : r.y;
      maxY = maxY > r.y ? maxY : r.y;
    }

    for (const r of rects) {
      let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute('x1', <string><any>(r.x - this._outerRect.x));
      line.setAttribute('x2', <string><any>(r.x - this._outerRect.x));
      line.setAttribute('y1', <string><any>(minY - this._outerRect.y));
      line.setAttribute('y2', <string><any>(maxY - this._outerRect.y));
      line.setAttribute('class', 'svg-snapline');
      this._svg.appendChild(line);

      let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute('x', <string><any>(r.x - this._outerRect.x));
      rect.setAttribute('width', <string><any>(r.width));
      rect.setAttribute('y', <string><any>(r.y - this._outerRect.y));
      rect.setAttribute('height', <string><any>(r.height));
      rect.setAttribute('class', 'svg-snapline');
      this._svg.appendChild(rect);
    }
  }
}