import { IDesignItem } from "../../../item/IDesignItem";
import { DesignerCanvas } from "../designerCanvas.js";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class IframeExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    // forward events to designer, so iframe is selectable via click
    let iframe = this.extendedItem.element as HTMLIFrameElement;
    iframe.contentWindow.onpointerdown = (e) => this._pointerEvent(e);
    iframe.contentWindow.onpointermove = (e) => this._pointerEvent(e);
    iframe.contentWindow.onpointerup = (e) => this._pointerEvent(e);
  }

  _pointerEvent(event: PointerEvent) {
    const rect = this.extendedItem.element.getBoundingClientRect();
    const that = this;
    const handler = {
      get(target, property) {
        switch (property) {
          case 'composedPath':
            return () => [that.extendedItem.element];
          case 'x':
          case 'clientX':
          case 'offsetX':
          case 'pageX':
            return target[property] + rect.x;
          case 'y':
          case 'clientY':
          case 'offsetY':
          case 'pageY':
            return target[property] + rect.y;
        }
        return target[property];
      }
    }

    event.preventDefault();
    event.stopPropagation();
    const proxy = new Proxy(event, handler);
    //@ts-ignore
    (<DesignerCanvas>this.designerCanvas)._pointerEventHandlerBound(proxy);
  }

  override refresh() {
  }

  override dispose() {
    this._removeAllOverlays();
  }
}