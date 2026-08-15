import {
    IDesignItem, IDesignerCanvas, IExtensionManager, SelectionDefaultExtensionProvider
} from '@node-projects/web-component-designer';
import { ZplGraphicCircle } from '../widgets/zpl-graphic-circle.js';
import { ZplGraphicDiagonalLine } from '../widgets/zpl-graphic-diagonal-line.js';

/**
 * Graphic circles and diagonal lines already describe their complete visual
 * boundary. A rectangular selection outline obscures that geometry, so those
 * widgets use resize handles without the generic selection rectangle.
 */
export class ZplSelectionExtensionProvider extends SelectionDefaultExtensionProvider {
    override shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
        if (designItem.element instanceof ZplGraphicCircle || designItem.element instanceof ZplGraphicDiagonalLine)
            return false;
        return super.shouldExtend(extensionManager, designerCanvas, designItem);
    }
}
