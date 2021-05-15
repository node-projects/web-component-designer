import { EventNames } from "../../../../enums/EventNames";
import { PointerActionType } from "../../../../enums/PointerActionType";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';

export class PrimarySelectionDefaultExtension extends AbstractExtension {

  constructor(designerView: IDesignerView, extendedItem: IDesignItem) {
    super(designerView, extendedItem);
  }

  override extend() {
    const rect = this.extendedItem.element.getBoundingClientRect();
    this._drawMoveOverlay(rect);
    this._drawRotateOverlay(rect);
    this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'nw-resize');
    this._drawResizerOverlay(rect.x + (rect.width / 2) - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'n-resize');
    this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'ne-resize');
    this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 'sw-resize');
    this._drawResizerOverlay(rect.x + (rect.width / 2) - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 's-resize');
    this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 'se-resize');
    this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y + (rect.height / 2) - this.designerView.containerBoundingRect.y, 'w-resize');
    this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y + (rect.height / 2) - this.designerView.containerBoundingRect.y, 'e-resize');
  }

  _drawMoveOverlay(itemRect: DOMRect) {
    const rect = this._drawRect(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y - 16, 60, 15, 'svg-primary-selection-move');
    rect.addEventListener(EventNames.PointerDown, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    rect.addEventListener(EventNames.PointerMove, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    rect.addEventListener(EventNames.PointerUp, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    this._drawText(this.extendedItem.name.substring(0, 10) + '…', itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y - 5, 'svg-text');
  }

  _drawRotateOverlay(itemRect: DOMRect) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    line.setAttribute('r', <string><any>(7.5));
    line.setAttribute('class', 'svg-selection svg-primary-rotate');
    line.setAttribute('style', 'cursor: grabbing');
    g.appendChild(line)
    const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g2.setAttribute('transform', 'translate(-8,0) scale(0.0015,-0.0015)');
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('style', 'fill: white');
    path.setAttribute('d', 'M5260,4367.9c-1803.6-157-3329.6-1457-3771.9-3212.8c-34.5-135.9-72.7-331.2-86.2-430.8c-11.5-99.6-24.9-201-30.6-224l-7.7-44H731.8c-528.4,0-631.8-3.8-631.8-26.8c0-42.1,2029.5-2042.9,2104.2-2073.6c36.4-15.3,86.2-21.1,118.7-15.3c40.2,9.6,346.6,300.6,1089.4,1037.7C3981-58.8,4446.3,414.2,4446.3,429.5c0,23-103.4,26.8-620.3,26.8c-342.7,0-626.1,5.7-629.9,15.3c-13.4,21.1,38.3,245.1,93.8,415.5c114.9,348.5,319.7,681.6,582.1,947.8c478.7,484.4,1062.6,731.4,1742.3,735.2c317.8,0,482.5-23,765.9-114.9c402.1-128.3,725.7-331.2,1022.4-641.4c455.7-474.8,687.4-1047.3,687.4-1702.1c-1.9-693.1-254.6-1284.7-754.4-1771c-396.3-384.9-882.7-614.6-1430.3-679.7c-141.7-17.2-195.3-32.6-227.9-63.2l-44-38.3v-811.8v-811.8l49.8-49.8c49.8-47.9,53.6-49.8,243.2-36.4c1606.4,105.3,3048.1,1146.9,3658.9,2646c453.8,1112.4,415.5,2379.9-105.3,3463.6c-360,752.5-953.5,1397.7-1677.3,1828.5c-515,308.3-1139.2,513.1-1746.2,574.4C5872.7,4379.4,5438.1,4383.3,5260,4367.9z');
    g2.appendChild(path);
    g.appendChild(g2);
    g.addEventListener(EventNames.PointerDown, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Rotate));
    g.addEventListener(EventNames.PointerMove, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Rotate));
    g.addEventListener(EventNames.PointerUp, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Rotate));
    g.setAttribute('class', 'svg-selection svg-primary-rotate');
    g.setAttribute('transform', 'translate(' + (itemRect.x - this.designerView.containerBoundingRect.x - 13) + ',' + (itemRect.y - this.designerView.containerBoundingRect.y - 8.5) + ')');
    this.overlayLayer.appendChild(g);
    this.overlays.push(g);
  }

  _drawResizerOverlay(x: number, y: number, cursor: string) {
    const circle = this._drawCircleOverlay(x, y, 3, 'svg-primary-resizer');
    circle.setAttribute('style', 'cursor: ' + cursor);
    circle.addEventListener(EventNames.PointerDown, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Resize, cursor));
    circle.addEventListener(EventNames.PointerMove, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Resize, cursor));
    circle.addEventListener(EventNames.PointerUp, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Resize, cursor));
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}