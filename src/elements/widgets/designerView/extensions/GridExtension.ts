import { CalculateGridInformation } from "../../../helper/GridHelper.js";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayer } from "./OverlayLayer.js";

export class GridExtension extends AbstractExtension {

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    const gridInformation = CalculateGridInformation(this.extendedItem);
    for (let gap of gridInformation.gaps) {
      this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-gap', null, OverlayLayer.Background);
    }
    for (let cellRow of gridInformation.cells) {
      for (let cell of cellRow) {
        this._drawRect(cell.x, cell.y, cell.width, cell.height, 'svg-grid', null, OverlayLayer.Background);
        if (cell.name) {
          const text = this._drawText(cell.name, cell.x, cell.y, 'svg-grid-area', null, OverlayLayer.Background);
          text.setAttribute("dominant-baseline", "hanging");
        }
      }
    }
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}