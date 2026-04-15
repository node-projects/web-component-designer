import { calculateGridInformation, getElementLocalToCanvasMatrix, getGridCellFromPoint } from "../../../../helper/GridHelper.js";
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
  private gridInformationString: string;
  private _lastEvent: Event;
  private gridColor: string;
  private gridFillColor: string;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem, gridColor: string, gridFillColor: string) {
    super(extensionManager, designerView, extendedItem);
    this.gridColor = gridColor;
    this.gridFillColor = gridFillColor;
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this._initSVGArrays();
    this.refresh(event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    this.gridInformation = calculateGridInformation(this.extendedItem);
    const gridInformationString = JSON.stringify(this.gridInformation);

    if (gridInformationString !== this.gridInformationString || (event != null && this._lastEvent !== event)) {
      if (event)
        this._lastEvent = event;

      this.gridInformationString = gridInformationString;
      let cells = this.gridInformation.cells;
      const hoveredCell = this._lastEvent && this._lastEvent instanceof MouseEvent
        ? getGridCellFromPoint(this.extendedItem, this.designerCanvas.getNormalizedEventCoordinates(this._lastEvent), this.gridInformation)
        : null;

      if (cells[0][0] && !isNaN(cells[0][0].height) && !isNaN(cells[0][0].width)) {
        if (this.gridInformation.cells.length != this._cells.length || this.gridInformation.cells[0].length != this._cells[0].length)
          this._initSVGArrays();

        if (!this._group) {
          this._group = this._drawGroup(null, this._group, OverlayLayer.Background);
          this._group.style.transformOrigin = '0 0';
          this._group.style.setProperty("--svg-grid-stroke-color", this.gridColor)
          this._group.style.setProperty("--svg-grid-fill-color", this.gridFillColor)
        }
        this._group.style.transform = getElementLocalToCanvasMatrix(this.extendedItem).toString();

        //draw gaps
        this.gridInformation.gaps.forEach((gap, i) => {
          this._gaps[i] = this._drawRect(gap.localX, gap.localY, gap.width, gap.height, 'svg-grid-gap', this._gaps[i], OverlayLayer.Background);
          this._group.appendChild(this._gaps[i]);
        });

        //draw cells
        cells.forEach((row, i) => {
          row.forEach((cell, j) => {
            this._cells[i][j] = this._drawRect(cell.localX, cell.localY, cell.width, cell.height, 'svg-grid', this._cells[i][j], OverlayLayer.Background);
            this._group.appendChild(this._cells[i][j]);
            if (cell.name) {
              this._texts[i][j] = this._drawText(cell.name, cell.localX, cell.localY, 'svg-grid-area', this._texts[i][j], OverlayLayer.Background);
              this._texts[i][j].setAttribute("dominant-baseline", "hanging");
            }
            if (hoveredCell?.row === i && hoveredCell?.column === j) {
              this._cells[i][j].setAttribute("class", "svg-grid-current-cell");
            }
          })
        });
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }

  _initSVGArrays() {
    this._removeAllOverlays();
    this._group = null;
    this.gridInformation = calculateGridInformation(this.extendedItem);
    this._cells = new Array(this.gridInformation.cells.length);
    this.gridInformation.cells.forEach((row, i) => this._cells[i] = new Array(row.length));
    this._texts = new Array(this.gridInformation.cells.length);
    this.gridInformation.cells.forEach((row, i) => this._texts[i] = new Array(row.length));
    this._gaps = new Array(this.gridInformation.gaps.length);
  }
}