import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';

export class ConditionExtensionProvider implements IDesignerExtensionProvider {
    constructor(extensionProvider: IDesignerExtensionProvider, condition: (designItem: IDesignItem) => boolean) {
        this.extensionProvider = extensionProvider;
        this.condition = condition;
        this.style = <any>extensionProvider.style ?? extensionProvider.constructor.style;
        this.svgDefs = <any>extensionProvider.svgDefs ?? extensionProvider.constructor.svgDefs;
    }

    extensionProvider: IDesignerExtensionProvider;
    condition: (designItem: IDesignItem) => boolean;
    style: CSSStyleSheet;
    svgDefs: string;

    shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
        if (!this.condition(designItem))
            return false;
        return this.extensionProvider.shouldExtend(extensionManager, designerView, designItem);
    }

    getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
        return this.extensionProvider.getExtension(extensionManager, designerView, designItem);
    }
}