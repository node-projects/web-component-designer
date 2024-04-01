import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { BasicDisplayToolbarExtension } from "../BasicDisplayToolbarExtension.js";
import { IExtensionManager } from "../IExtensionManger.js";

export class BlockToolbarExtension extends BasicDisplayToolbarExtension {

  protected static template = html`
      <div style="height: 100%; width: 100%;">
        ${BasicDisplayToolbarExtension.basicTemplate}
      </div>
    `;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event: MouseEvent) {
      super.extend(cache, event);
      this.refresh(cache, event);
    }
}