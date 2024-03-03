import { IExtensionManager, IDesignerCanvas, IDesignItem, ResizeExtensionProvider } from '@node-projects/web-component-designer';
import { ZplImage } from '../widgets/zpl-image.js';
import { ZplBarcode } from '../widgets/zpl-barcode.js';
import { ZplText } from '../widgets/zpl-text.js';



export class ZplLayoutResizeExtensionProvider extends ResizeExtensionProvider {
    override shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
        //return designItem.element.localName !== MfcConfigRoute.is;
        switch (designItem.name) {
            case ZplImage.is:
            case ZplBarcode.is:
            case ZplText.is:
                return false;
        }
        return true;
    }
}
