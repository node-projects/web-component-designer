import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { TransformOriginExtension } from "./TransformOriginExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class TransformOriginExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    if (designItem.node instanceof HTMLElement || (designItem.node instanceof SVGElement && designItem.node.localName === 'svg'))
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new TransformOriginExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-transform-origin { stroke: #3899ec; fill: black; pointer-events: all }
  `;    
}