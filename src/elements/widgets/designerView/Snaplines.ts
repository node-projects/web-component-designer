import type { IDesignItem } from "../../item/IDesignItem";
import { DomHelper } from "../../helper/DomHelper";
import type { IPoint } from "../../../interfaces/IPoint";
import type { ISize } from '../../../interfaces/ISize';
//import { readyException } from "jquery";

export class Snaplines {

  public snapOffset = 10;

  private _svg: SVGElement;
  private _containerItem: IDesignItem;
  private _positionsH: Map<number, DOMRect[]> = new Map();
  private _positionsMiddleH: Map<number, DOMRect[]> = new Map();
  private _positionsV: Map<number, DOMRect[]> = new Map();
  private _positionsMiddleV: Map<number, DOMRect[]> = new Map();
  private _outerRect: DOMRect;
  //private _lastPh: DOMRect[];

  constructor(svg: SVGElement) {
    this._svg = svg;
  }

  initialize(containerItem: IDesignItem) {
    //add snapline layer
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

        let pLeft = p.left - this._outerRect.left;
        let pMidH = p.left - this._outerRect.left + Math.round(p.width / 2)
        let pRight = p.left - this._outerRect.left + p.width;
        if (!this._positionsH.has(pLeft))
          this._positionsH.set(pLeft, []);
        this._positionsH.get(pLeft).push(p);
        if (!this._positionsH.has(pRight))
          this._positionsH.set(pRight, []);
        this._positionsH.get(pRight).push(p);
        if (!this._positionsMiddleH.has(pMidH))
          this._positionsMiddleH.set(pMidH, []);
        this._positionsMiddleH.get(pMidH).push(p);

        let pTop = p.top - this._outerRect.top;
        let pMidV = p.top - this._outerRect.top + Math.round(p.height / 2)
        let pBottom = p.top - this._outerRect.top + p.height;
        if (!this._positionsV.has(pTop))
          this._positionsV.set(pTop, []);
        this._positionsV.get(pTop).push(p);
        if (!this._positionsV.has(pBottom))
          this._positionsV.set(pBottom, []);
        this._positionsV.get(pBottom).push(p);
        if (!this._positionsMiddleV.has(pMidV))
          this._positionsMiddleV.set(pMidV, []);
        this._positionsMiddleV.get(pMidV).push(p);
      }
    }
  }

  //return the snapped position
  snapToPosition(position: IPoint, size: ISize, moveDirection: IPoint): IPoint {
    let pH = this._positionsH.get(position.x);
    if (pH === undefined)
      pH = this._positionsMiddleH.get(position.x + Math.round(size.width / 2));
    let posH = position.x;
    if (pH === undefined) {
      for (let i = 1; i <= this.snapOffset; i++) {
        let pSmall = this._positionsH.get(position.x - i);
        if (pSmall === undefined)
          pSmall = this._positionsH.get(position.x - i + size.width);
        if (pSmall === undefined)
          pSmall = this._positionsMiddleH.get(position.x - i + Math.round(size.width / 2));
        let pBig = this._positionsH.get(position.x + i);
        if (pBig === undefined)
          pBig = this._positionsH.get(position.x - i + size.width);
        if (pBig === undefined)
          pBig = this._positionsMiddleH.get(position.x - i + Math.round(size.width / 2));
        if (pSmall !== undefined && pBig !== undefined) {
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

    let pV = this._positionsV.get(position.y);
    if (pV === undefined)
      pV = this._positionsMiddleV.get(position.y + Math.round(size.height / 2));
    let posV = position.y;
    if (pV === undefined) {
      for (let i = 1; i <= this.snapOffset; i++) {
        let pSmall = this._positionsV.get(position.y - i);
        if (pSmall === undefined)
          pSmall = this._positionsV.get(position.y - i + size.height);
        if (pSmall === undefined)
          pSmall = this._positionsMiddleV.get(position.y - i + Math.round(size.height / 2));
        let pBig = this._positionsV.get(position.y + i);
        if (pBig === undefined)
          pBig = this._positionsV.get(position.y - i + size.height);
        if (pBig === undefined)
          pBig = this._positionsMiddleV.get(position.y - i + Math.round(size.height / 2));
        if (pSmall !== undefined && pBig !== undefined) {
          if (moveDirection.y > 0) {
            pV = pBig;
            posV = position.y + i;
          } else {
            pV = pSmall;
            posV = position.y - i;
          }
        } else {
          pV = pBig ? pBig : pSmall;
          posV = pBig ? position.y + i : position.y - i;
        }
        if (pV)
          break;
      }
    }

    DomHelper.removeAllChildnodes(this._svg);

    if (pH !== undefined || pV !== undefined) {
      let pos = { x: pH !== undefined ? posH : position.x, y: pV !== undefined ? posV : position.y };
      this.drawSnaplines(pos, size, pH, pV);
      return { x: pH !== undefined ? posH : null, y: pV !== undefined ? posV : null };
    }

    return { x: null, y: null };
  }

  drawSnaplines(position: IPoint, size: ISize, rectsH: DOMRect[], rectsV: DOMRect[]) {
    if (rectsH) {
      let minY = position.y;
      let maxY = position.y;
      for (const r of rectsH) {
        let ry = r.y - this._outerRect.top;
        minY = minY < ry ? minY : ry;
        maxY = maxY > ry ? maxY : ry;
      }
      for (const r of rectsH) {
        if (r.x - this._outerRect.left == position.x || r.x - this._outerRect.left == position.x + size.width) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(r.x - this._outerRect.x));
          line.setAttribute('x2', <string><any>(r.x - this._outerRect.x));
          line.setAttribute('y1', <string><any>(minY));
          line.setAttribute('y2', <string><any>(maxY));
          line.setAttribute('class', 'svg-snapline');
          this._svg.appendChild(line);
        }

        if (r.x - this._outerRect.left + r.width == position.x || r.x - this._outerRect.left + r.width == position.x + size.width) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(r.x - this._outerRect.x + r.width));
          line.setAttribute('x2', <string><any>(r.x - this._outerRect.x + r.width));
          line.setAttribute('y1', <string><any>(minY));
          line.setAttribute('y2', <string><any>(maxY));
          line.setAttribute('class', 'svg-snapline');
          this._svg.appendChild(line);
        }

        if (r.x - this._outerRect.left + Math.round(r.width / 2) == position.x + Math.round(size.width / 2)) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(r.x - this._outerRect.x + Math.round(r.width / 2)));
          line.setAttribute('x2', <string><any>(r.x - this._outerRect.x + Math.round(r.width / 2)));
          line.setAttribute('y1', <string><any>(minY));
          line.setAttribute('y2', <string><any>(maxY));
          line.setAttribute('class', 'svg-snapline');
          this._svg.appendChild(line);
        }

        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', <string><any>(r.x - this._outerRect.x));
        rect.setAttribute('width', <string><any>(r.width));
        rect.setAttribute('y', <string><any>(r.y - this._outerRect.y));
        rect.setAttribute('height', <string><any>(r.height));
        rect.setAttribute('class', 'svg-snapline');
        this._svg.appendChild(rect);
      }
    }

    if (rectsV) {
      let minX = position.x;
      let maxX = position.x;
      for (const r of rectsV) {
        let rx = r.x - this._outerRect.left;
        minX = minX < rx ? minX : rx;
        maxX = maxX > rx ? maxX : rx;
      }
      for (const r of rectsV) {
        if (r.y - this._outerRect.top == position.y || r.y - this._outerRect.top == position.y + size.height) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(minX));
          line.setAttribute('x2', <string><any>(maxX));
          line.setAttribute('y1', <string><any>(r.y - this._outerRect.y));
          line.setAttribute('y2', <string><any>(r.y - this._outerRect.y));
          line.setAttribute('class', 'svg-snapline');
          this._svg.appendChild(line);
        }

        if (r.y - this._outerRect.top + r.height == position.y || r.y - this._outerRect.top + r.height == position.y + size.height) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(minX));
          line.setAttribute('x2', <string><any>(maxX));
          line.setAttribute('y1', <string><any>(r.y - this._outerRect.y + r.height));
          line.setAttribute('y2', <string><any>(r.y - this._outerRect.y + r.height));
          line.setAttribute('class', 'svg-snapline');
          this._svg.appendChild(line);
        }

        if (r.y - this._outerRect.top + Math.round(r.height / 2) == position.y + Math.round(size.height / 2)) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(minX));
          line.setAttribute('x2', <string><any>(maxX));
          line.setAttribute('y1', <string><any>(r.y - this._outerRect.y + Math.round(r.height / 2)));
          line.setAttribute('y2', <string><any>(r.y - this._outerRect.y + Math.round(r.height / 2)));
          line.setAttribute('class', 'svg-snapline');
          this._svg.appendChild(line);
        }

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
}