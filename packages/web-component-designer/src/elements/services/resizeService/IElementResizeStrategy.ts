import { ISize } from '../../../interfaces/ISize.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IService } from '../IService.js';

export type ResizeHandle = 'nw-resize' | 'n-resize' | 'ne-resize' | 'w-resize' |
    'sw-resize' | 's-resize' | 'e-resize' | 'se-resize';

export interface ElementResizeContext {
    readonly designItem: IDesignItem;
    readonly handle: ResizeHandle;
    readonly initialSize: ISize;
    readonly currentSize: ISize;
}

/** A strategy may remap the active handle after normalising signed geometry.
 * This keeps the original fixed point anchored when a dragged corner crosses
 * it on either axis. */
export interface ElementResizePreview extends ISize {
    readonly anchorHandle?: ResizeHandle;
}

/**
 * Maps a visual resize gesture to element-specific model properties. The
 * ResizeExtension owns pointer geometry and the undo group; a strategy owns
 * property quantisation and may return the size produced by its preview.
 */
export interface IElementResizeStrategy extends IService {
    isHandledElement(designItem: IDesignItem): boolean;
    getEnabledHandles(designItem: IDesignItem): readonly ResizeHandle[];
    begin(context: ElementResizeContext): unknown;
    preview(context: ElementResizeContext, state: unknown): ElementResizePreview | void;
    commit(context: ElementResizeContext, state: unknown): void;
    cancel(context: ElementResizeContext, state: unknown): void;
}
