import { calculateGridInformation } from "../../../../helper/GridHelper.js";
import { getElementCombinedTransform } from "../../../../helper/TransformHelper.js";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";

export class DisplayGridExtension extends AbstractExtension {

  private _cells: SVGRectElement[][];
  private _texts: SVGTextElement[][];
  private _gaps: SVGRectElement[];
  private _group: SVGGElement;

  private gridInformation: ReturnType<typeof calculateGridInformation>

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string|symbol, any>, event?: Event) {
    this._initSVGArrays();
    this.refresh(event);
  }

  override refresh(cache: Record<string|symbol, any>, event?: Event) {
    this.gridInformation = calculateGridInformation(this.extendedItem);
    let cells = this.gridInformation.cells;

    if (!this._group) {
    this._group = this._drawGroup(null, this._group, OverlayLayer.Background);
    this._group.style.transform = getElementCombinedTransform(<HTMLElement>this.extendedItem.element).toString();
    this._group.style.transformOrigin = '0 0';
    this._group.style.transformBox = 'fill-box';
    }

    if (cells[0][0] && !isNaN(cells[0][0].height) && !isNaN(cells[0][0].width)) {
      if (this.gridInformation.cells.length != this._cells.length || this.gridInformation.cells[0].length != this._cells[0].length)
        this._initSVGArrays();

      //draw gaps
      this.gridInformation.gaps.forEach((gap, i) => {
        this._gaps[i] = this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-gap', this._gaps[i], OverlayLayer.Background);
        this._group.appendChild(this._gaps[i]);
      });

      //draw cells
      cells.forEach((row, i) => {
        row.forEach((cell, j) => {
          this._cells[i][j] = this._drawRect(cell.x, cell.y, cell.width, cell.height, 'svg-grid', this._cells[i][j], OverlayLayer.Background);
          this._group.appendChild(this._cells[i][j]);
          if (cell.name) {
            this._texts[i][j] = this._drawText(cell.name, cell.x, cell.y, 'svg-grid-area', this._texts[i][j], OverlayLayer.Background);
            this._texts[i][j].setAttribute("dominant-baseline", "hanging");
          }
          if (event && event instanceof MouseEvent) {
            let crd = this.designerCanvas.getNormalizedEventCoordinates(event);
            if (crd.x >= cell.x && crd.y >= cell.y && crd.x <= cell.x + cell.width && crd.y <= cell.y + cell.height) {
              this._cells[i][j].setAttribute("class", "svg-grid-current-cell");
            }
          }
        })
      });
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }

  _initSVGArrays() {
    this._removeAllOverlays();
    this.gridInformation = calculateGridInformation(this.extendedItem);
    this._cells = new Array(this.gridInformation.cells.length);
    this.gridInformation.cells.forEach((row, i) => this._cells[i] = new Array(row.length));
    this._texts = new Array(this.gridInformation.cells.length);
    this.gridInformation.cells.forEach((row, i) => this._texts[i] = new Array(row.length));
    this._gaps = new Array(this.gridInformation.gaps.length);
  }
}