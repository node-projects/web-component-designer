import { calculateOuterRect } from '../../../helper/ElementHelper.js';
import { filterChildPlaceItems } from '../../../helper/LayoutHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';

export class MultipleSelectionRectExtension extends AbstractExtension {
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;
  private _designerView: any;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
    this._designerView = designerView;
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let selection = this._designerView.instanceServiceContainer.selectionService.selectedElements;
    if (selection.length > 1) {
      selection = filterChildPlaceItems(selection);
      let rect = calculateOuterRect(selection, this._designerView)

      this._line1 = this._drawLine(rect.x, rect.y, rect.x + rect.width, rect.y, 'svg-multiple-rect-selection', this._line1, OverlayLayer.Background);
      this._line2 = this._drawLine(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, 'svg-multiple-rect-selection', this._line2, OverlayLayer.Background);
      this._line3 = this._drawLine(rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height, 'svg-multiple-rect-selection', this._line3, OverlayLayer.Background);
      this._line4 = this._drawLine(rect.x, rect.y + rect.height, rect.x, rect.y, 'svg-multiple-rect-selection', this._line4, OverlayLayer.Background);
      this._line1.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
      this._line2.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
      this._line3.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
      this._line4.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}