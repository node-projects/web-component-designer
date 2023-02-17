import { CalculateGridInformation } from "../../../../helper/GridHelper.js";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";

export class DisplayGridExtension extends AbstractExtension {

  private _cells: SVGRectElement[][];
  private _gaps: SVGRectElement[];

  private gridInformation: {
    cells?: {
      x: number;
      y: number;
      width: number;
      initWidthUnit: string;
      height: number;
      initHeightUnit: string;
      name: string;
    }[][];
    gaps?: {
      x: number;
      y: number;
      width: number;
      height: number;
      column?: number;
      row?: number;
    }[];
  }

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this._initSVGArrays();
    this.refresh();
  }

  override refresh() {
    this.gridInformation = CalculateGridInformation(this.extendedItem);
    let cells = this.gridInformation.cells;

    if (cells[0][0] && !isNaN(cells[0][0].height) && !isNaN(cells[0][0].width)) {
      if (this.gridInformation.cells.length != this._cells.length || this.gridInformation.cells[0].length != this._cells[0].length)
        this._initSVGArrays();

      //draw gaps
      this.gridInformation.gaps.forEach((gap, i) => {
        this._gaps[i] = this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-gap', this._gaps[i], OverlayLayer.Foregorund);
      })

      //draw cells
      cells.forEach((row, i) => {
        row.forEach((cell, j) => {
          this._cells[i][j] = this._drawRect(cell.x, cell.y, cell.width, cell.height, 'svg-grid', this._cells[i][j], OverlayLayer.Background);
          if (cell.name) {
            const text = this._drawText(cell.name, cell.x, cell.y, 'svg-grid-area', null, OverlayLayer.Background);
            text.setAttribute("dominant-baseline", "hanging");
          }
        })
      })



    }
  }

  override dispose() {
    this._removeAllOverlays();
  }

  _initSVGArrays() {
    this._removeAllOverlays();
    this.gridInformation = CalculateGridInformation(this.extendedItem);
    this._cells = new Array(this.gridInformation.cells.length);
    this.gridInformation.cells.forEach((row, i) => this._cells[i] = new Array(row.length));
    this._gaps = new Array(this.gridInformation.gaps.length);
  }
}