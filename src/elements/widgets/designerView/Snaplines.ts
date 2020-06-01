import { IDesignItem } from "../../item/IDesignItem";
import { DomHelper } from "../../helper/DomHelper";

export class Snaplines {

  public snapOffset = 5;

  private _svg: SVGElement;
  private _containerItem: IDesignItem;

  constructor(svg: SVGElement) {
    this._svg = svg;
  }

  initialize(containerItem: IDesignItem) {
    //add snapline layer, add svg for snaplines
    this._containerItem = containerItem;
  }

  //recalculate snaplines
  calculateSnaplines() {
    let outer = this._containerItem.element.getBoundingClientRect();
    for (let n of DomHelper.getAllChildNodes(this._containerItem.element)) {
      let p = (<Element>n).getBoundingClientRect();
      let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute('x1', <string><any>(p.x - outer.x));
      line.setAttribute('x2', <string><any>(p.x - outer.x));
      line.setAttribute('y1', '0');
      line.setAttribute('y2', '200');
      line.setAttribute('class', 'svg-snapline');
      this._svg.appendChild(line);
    }
  }

  //return the snapped position
  snapToPosition() {

  }

  //draw snaplines at position (if there are any)
  drawSnaplines(position) {

  }
}