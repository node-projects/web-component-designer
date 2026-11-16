import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import type { IContentChanged } from '../InstanceServiceContainer.js';

export interface IMiniatureViewService {
    provideMiniatureView(designerCanvas: IDesignerCanvas): Promise<Node>;
    /** Omit redraws for changes that do not affect this service's representation. */
    shouldRefresh?(designerCanvas: IDesignerCanvas, changes: readonly IContentChanged[]): boolean;
}