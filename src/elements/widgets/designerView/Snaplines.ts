import type { IDesignItem } from '../../item/IDesignItem.js';
import type { IPoint } from '../../../interfaces/IPoint.js';
import type { ISize } from '../../../interfaces/ISize.js';
import { OverlayLayerView } from './overlayLayerView.js';
import { OverlayLayer } from "./extensions/OverlayLayer.js";
import { IRect } from "../../../interfaces/IRect.js";

const overlayLayer = OverlayLayer.Normal;

export class Snaplines {

  public snapOffset = 5;
  private _overlayLayerView: OverlayLayerView;

  private _containerItem: IDesignItem;
  private _positionsH: [number, IRect][] = [];
  private _positionsMiddleH: [number, IRect][] = [];
  private _positionsV: [number, IRect][] = [];
  private _positionsMiddleV: [number, IRect][] = [];
  private _outerRect: DOMRect;

  constructor(overlayLayer: OverlayLayerView) {
    this._overlayLayerView = overlayLayer;
  }

  initialize(containerItem: IDesignItem) {
    //add snapline layer
    this._containerItem = containerItem;
  }

  clearSnaplines() {
    if (this._overlayLayerView.removeAllNodesWithClass)
      this._overlayLayerView.removeAllNodesWithClass('svg-snapline');
    this._positionsH = [];
    this._positionsMiddleH = [];
    this._positionsV = [];
    this._positionsMiddleV = [];
  }

  calculateSnaplines(ignoredItems: IDesignItem[]) {
    this.clearSnaplines();
    const providedSnaplines = this._containerItem.serviceContainer.snaplinesProviderService.provideSnaplines(this._containerItem, ignoredItems);
    this._outerRect = providedSnaplines.outerRect;
    this._positionsH = providedSnaplines.positionsH;
    this._positionsMiddleH = providedSnaplines.positionsMiddleH;
    this._positionsV = providedSnaplines.positionsV;
    this._positionsMiddleV = providedSnaplines.positionsMiddleV;
  }

  //return the snapped position
  snapToPosition(position: IPoint, size: ISize, moveDirection: IPoint): IPoint {
    let minDiff = this.snapOffset + 1;
    let pH = undefined;
    let posH = undefined;
    for (let i = 0; i < this._positionsH.length; i++) {
      let akDiff1 = Math.abs(this._positionsH[i][0] - position.x);
      if (akDiff1 < minDiff || (akDiff1 === minDiff && pH === undefined)) {
        minDiff = akDiff1;
        pH = [];
        posH = this._positionsH[i][0];
      }
      let akDiff2: number;
      if (size) {
        akDiff2 = Math.abs(position.x + size.width - this._positionsH[i][0]);
        if (akDiff2 < minDiff || (akDiff2 === minDiff && pH === undefined)) {
          minDiff = akDiff2;
          pH = [];
          posH = this._positionsH[i][0] - size.width;
        }
      }
      if (akDiff1 === minDiff) {
        pH.push(this._positionsH[i][1]);
      }
      if (size) {
        if (akDiff2 === minDiff && akDiff1 !== minDiff) {
          pH.push(this._positionsH[i][1]);
        }
      }
    }
    if (size) {
      for (let i = 0; i < this._positionsMiddleH.length; i++) {
        let akDiff1 = Math.abs(this._positionsMiddleH[i][0] - (position.x + size.width / 2));
        if (akDiff1 < minDiff || (akDiff1 === minDiff && pH === undefined)) {
          minDiff = akDiff1;
          pH = [];
          posH = this._positionsMiddleH[i][0] - size.width / 2;
        }
        if (akDiff1 === minDiff) {
          pH.push(this._positionsMiddleH[i][1]);
        }
      }
    }

    minDiff = this.snapOffset + 1;
    let pV = undefined;
    let posV = undefined;
    for (let i = 0; i < this._positionsV.length; i++) {
      let akDiff1 = Math.abs(this._positionsV[i][0] - position.y);
      if (akDiff1 < minDiff || (akDiff1 === minDiff && pV === undefined)) {
        minDiff = akDiff1;
        pV = [];
        posV = this._positionsV[i][0];
      }
      let akDiff2: number;
      if (size) {
        akDiff2 = Math.abs(position.y + size.height - this._positionsV[i][0]);
        if (akDiff2 < minDiff || (akDiff2 === minDiff && pV === undefined)) {
          minDiff = akDiff2;
          pV = [];
          posV = this._positionsV[i][0] - size.height;
        }
      }
      if (akDiff1 === minDiff) {
        pV.push(this._positionsV[i][1]);
      }
      if (size) {
        if (akDiff2 === minDiff && akDiff1 !== minDiff) {
          pV.push(this._positionsV[i][1]);
        }
      }
    }
    if (size) {
      for (let i = 0; i < this._positionsMiddleV.length; i++) {
        let akDiff1 = Math.abs(this._positionsMiddleV[i][0] - (position.y + size.height / 2));
        if (akDiff1 < minDiff || (akDiff1 === minDiff && pV === undefined)) {
          minDiff = akDiff1;
          pV = [];
          posV = this._positionsMiddleV[i][0] - size.height / 2;
        }
        if (akDiff1 === minDiff) {
          pV.push(this._positionsMiddleV[i][1]);
        }
      }
    }

    this._overlayLayerView.removeAllNodesWithClass('svg-snapline');

    if (pH !== undefined || pV !== undefined) {
      let pos = { x: pH !== undefined ? posH : position.x, y: pV !== undefined ? posV : position.y };
      this.drawSnaplines(pos, size, pH, pV);
      return { x: pH !== undefined ? posH : null, y: pV !== undefined ? posV : null };
    }

    return { x: null, y: null };
  }

  drawSnaplines(position: IPoint, size: ISize, rectsH: IRect[], rectsV: IRect[]) {
    if (rectsH) {
      let minY = position.y;
      let maxY = position.y;
      for (const r of rectsH) {
        let ry = r.y - this._outerRect.top;
        minY = minY < ry ? minY : ry;
        maxY = maxY > ry ? maxY : ry;
      }
      for (const r of rectsH) {
        if (r.x - this._outerRect.left == position.x || (size && r.x - this._outerRect.left == position.x + size.width)) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(r.x - this._outerRect.x));
          line.setAttribute('x2', <string><any>(r.x - this._outerRect.x));
          line.setAttribute('y1', <string><any>(minY));
          line.setAttribute('y2', <string><any>(maxY));
          line.setAttribute('class', 'svg-snapline');
          this._overlayLayerView.addOverlay(this.constructor.name, line, overlayLayer);
        }

        if (r.x - this._outerRect.left + r.width == position.x || (size && r.x - this._outerRect.left + r.width == position.x + size.width)) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(r.x - this._outerRect.x + r.width));
          line.setAttribute('x2', <string><any>(r.x - this._outerRect.x + r.width));
          line.setAttribute('y1', <string><any>(minY));
          line.setAttribute('y2', <string><any>(maxY));
          line.setAttribute('class', 'svg-snapline');
          this._overlayLayerView.addOverlay(this.constructor.name, line, overlayLayer);
        }

        if (size && r.x - this._outerRect.left + r.width / 2 == position.x + size.width / 2) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(r.x - this._outerRect.x + r.width / 2));
          line.setAttribute('x2', <string><any>(r.x - this._outerRect.x + r.width / 2));
          line.setAttribute('y1', <string><any>(minY));
          line.setAttribute('y2', <string><any>(maxY));
          line.setAttribute('class', 'svg-snapline');
          this._overlayLayerView.addOverlay(this.constructor.name, line, overlayLayer);
        }

        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', <string><any>(r.x - this._outerRect.x));
        rect.setAttribute('width', <string><any>(r.width));
        rect.setAttribute('y', <string><any>(r.y - this._outerRect.y));
        rect.setAttribute('height', <string><any>(r.height));
        rect.setAttribute('class', 'svg-snapline');
        this._overlayLayerView.addOverlay(this.constructor.name, rect, overlayLayer);
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
        if (r.y - this._outerRect.top == position.y || (size && r.y - this._outerRect.top == position.y + size.height)) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(minX));
          line.setAttribute('x2', <string><any>(maxX));
          line.setAttribute('y1', <string><any>(r.y - this._outerRect.y));
          line.setAttribute('y2', <string><any>(r.y - this._outerRect.y));
          line.setAttribute('class', 'svg-snapline');
          this._overlayLayerView.addOverlay(this.constructor.name, line, overlayLayer);
        }

        if (r.y - this._outerRect.top + r.height == position.y || (size && r.y - this._outerRect.top + r.height == position.y + size.height)) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(minX));
          line.setAttribute('x2', <string><any>(maxX));
          line.setAttribute('y1', <string><any>(r.y - this._outerRect.y + r.height));
          line.setAttribute('y2', <string><any>(r.y - this._outerRect.y + r.height));
          line.setAttribute('class', 'svg-snapline');
          this._overlayLayerView.addOverlay(this.constructor.name, line, overlayLayer);
        }

        if (size && r.y - this._outerRect.top + r.height / 2 == position.y + size.height / 2) {
          let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', <string><any>(minX));
          line.setAttribute('x2', <string><any>(maxX));
          line.setAttribute('y1', <string><any>(r.y - this._outerRect.y + r.height / 2));
          line.setAttribute('y2', <string><any>(r.y - this._outerRect.y + r.height / 2));
          line.setAttribute('class', 'svg-snapline');
          this._overlayLayerView.addOverlay(this.constructor.name, line, overlayLayer);
        }

        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', <string><any>(r.x - this._outerRect.x));
        rect.setAttribute('width', <string><any>(r.width));
        rect.setAttribute('y', <string><any>(r.y - this._outerRect.y));
        rect.setAttribute('height', <string><any>(r.height));
        rect.setAttribute('class', 'svg-snapline');
        this._overlayLayerView.addOverlay(this.constructor.name, rect, overlayLayer);
      }
    }
  }
}