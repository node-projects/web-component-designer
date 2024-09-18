import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';

export class ConditionExtensionProvider implements IDesignerExtensionProvider {
    constructor(extensionProvider: IDesignerExtensionProvider, condition: (designItem: IDesignItem, designerCanvas: IDesignerCanvas) => boolean, recheckOnRefresh: boolean = false) {
        this.extensionProvider = extensionProvider;
        this.condition = condition;
        this.style = <any>extensionProvider.style ?? extensionProvider.constructor.style;
        this.svgDefs = <any>extensionProvider.svgDefs ?? extensionProvider.constructor.svgDefs;
    }

    extensionProvider: IDesignerExtensionProvider;
    condition: (designItem: IDesignItem, designerCanvas: IDesignerCanvas) => boolean;
    style: CSSStyleSheet;
    svgDefs: string;

    shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
        if (!this.condition(designItem, designerCanvas))
            return false;
        return this.extensionProvider.shouldExtend(extensionManager, designerCanvas, designItem);
    }

    getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
        return this.extensionProvider.getExtension(extensionManager, designerCanvas, designItem);
    }
}