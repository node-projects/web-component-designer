import type { IDesignItem } from "../../item/IDesignItem";
import { DomHelper } from "../../helper/DomHelper";
import type { IPoint } from "../../../interfaces/IPoint";
import type { ISize } from '../../../interfaces/ISize';
//import { readyException } from "jquery";

export class Snaplines {

  public snapOffset = 20;

  private _svg: SVGElement;
  private _containerItem: IDesignItem;
  private _positionsH: [number, DOMRect][] = [];
  private _positionsMiddleH: [number, DOMRect][] = [];
  private _positionsV: [number, DOMRect][] = [];
  private _positionsMiddleV: [number, DOMRect][] = [];
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
    this._positionsH = [];
    this._positionsMiddleH = [];
    this._positionsV = [];
    this._positionsMiddleV = [];
  }

  calculateSnaplines(ignoredItems: IDesignItem[]) {
    this.clearSnaplines();
    let ignMap = new Map<Element, IDesignItem>(ignoredItems.map(i => [i.element, i]));
    this._outerRect = this._containerItem.element.getBoundingClientRect();

    for (let n of DomHelper.getAllChildNodes(this._containerItem.element)) {
      if (!ignMap.has(<Element>n)) {
        let p = (<Element>n).getBoundingClientRect();

        let pLeft = p.x - this._outerRect.x;
        let pMidH = p.x - this._outerRect.x + p.width / 2;
        let pRight = p.x - this._outerRect.x + p.width;
        this._positionsH.push([pLeft, p])
        this._positionsMiddleH.push([pMidH, p])
        this._positionsH.push([pRight, p])


        let pTop = p.y - this._outerRect.y;
        let pMidV = p.y - this._outerRect.y + p.height / 2;
        let pBottom = p.y - this._outerRect.y + p.height;
        this._positionsV.push([pTop, p])
        this._positionsMiddleV.push([pMidV, p])
        this._positionsV.push([pBottom, p])
      }
    }
    this._positionsH.sort((a, b) => a[0] - b[0]);
    this._positionsMiddleH.sort((a, b) => a[0] - b[0]);
    this._positionsV.sort((a, b) => a[0] - b[0]);
    this._positionsMiddleV.sort((a, b) => a[0] - b[0]);
  }

  //return the snapped position
  snapToPosition(position: IPoint, size: ISize, moveDirection: IPoint): IPoint {
    console.log(this._positionsH[0], position.x)
    let idx = this._positionsH.findIndex(x => x[0] > position.x);
    /*let idx2 = this._positionsH.findIndex(x => x[0] + size.width > position.x);
    if (idx2 >= 0) {
      if (idx < 0 || this._positionsH[idx][0] > (this._positionsH[idx2][0] - size.width))
        idx = idx2;
    }*/
    let pH = undefined;
    let posH = undefined;
    if (idx >= 0) {
      if (this._positionsH[idx][0] <= position.x + this.snapOffset) {
        posH = this._positionsH[idx][0];
        pH = [this._positionsH[idx][1]];
        for (let i = idx + 1; i < this._positionsH.length; i++) {
          if (this._positionsH[i][0] === posH)
            pH.push(this._positionsH[i][1]);
          break;
        }
      }
    }
    if (idx > 0) {
      if ((posH === undefined || this._positionsH[idx - 1][0] - position.x > position.x - this._positionsH[idx - 1][0]) && this._positionsH[idx - 1][0] >= position.x - this.snapOffset) {
        posH = this._positionsH[idx - 1][0];
        pH = [this._positionsH[idx - 1][1]];
        for (let i = idx - 2; i >= 0; i--) {
          if (this._positionsH[i][0] === posH)
            pH.push(this._positionsH[i][1]);
          break;
        }
      }
    }

    idx = this._positionsV.findIndex(x => x[0] > position.y);
    //idx2 = this._positionsH.findIndex(x => x[0] > position.y + size.height);
    let pV = undefined;
    let posV = undefined;
    if (idx >= 0) {
      if (this._positionsV[idx][0] <= position.y + this.snapOffset) {
        posV = this._positionsV[idx][0];
        pV = [this._positionsV[idx][1]];
        for (let i = idx + 1; i < this._positionsV.length; i++) {
          if (this._positionsV[i][0] === posV)
            pV.push(this._positionsV[i][1]);
          break;
        }
      }
    }
    if (idx > 0) {
      if ((posV === undefined || this._positionsV[idx - 1][0] - position.y > position.y - this._positionsV[idx - 1][0]) && this._positionsV[idx - 1][0] >= position.y - this.snapOffset) {
        posV = this._positionsV[idx - 1][0];
        pV = [this._positionsV[idx - 1][1]];
        for (let i = idx - 2; i >= 0; i--) {
          if (this._positionsV[i][0] === posH)
            pV.push(this._positionsV[i][1]);
          break;
        }
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