import {
    ElementResizeContext, ElementResizePreview, IDesignItem, IElementResizeStrategy, ResizeHandle
} from '@node-projects/web-component-designer';
import { ZplGraphicCircle } from '../widgets/zpl-graphic-circle.js';
import { ZplGraphicDiagonalLine } from '../widgets/zpl-graphic-diagonal-line.js';

interface GraphicResizeState {
    originalWidth: string;
    originalHeight: string;
    originalLeft: string;
    originalTop: string;
    originalRight: string;
    originalBottom: string;
}

const circleHandles: readonly ResizeHandle[] = ['n-resize', 'w-resize', 's-resize', 'e-resize'];

function crossedHandle(handle: ResizeHandle, crossedX: boolean, crossedY: boolean): ResizeHandle {
    let result = handle;
    if (crossedX) {
        const horizontal: Partial<Record<ResizeHandle, ResizeHandle>> = {
            'nw-resize': 'ne-resize', 'ne-resize': 'nw-resize',
            'sw-resize': 'se-resize', 'se-resize': 'sw-resize',
            'w-resize': 'e-resize', 'e-resize': 'w-resize'
        };
        result = horizontal[result] ?? result;
    }
    if (crossedY) {
        const vertical: Partial<Record<ResizeHandle, ResizeHandle>> = {
            'nw-resize': 'sw-resize', 'sw-resize': 'nw-resize',
            'ne-resize': 'se-resize', 'se-resize': 'ne-resize',
            'n-resize': 's-resize', 's-resize': 'n-resize'
        };
        result = vertical[result] ?? result;
    }
    return result;
}

export class ZplGraphicResizeStrategy implements IElementResizeStrategy {
    isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof ZplGraphicCircle || designItem.element instanceof ZplGraphicDiagonalLine;
    }

    getEnabledHandles(designItem: IDesignItem): readonly ResizeHandle[] {
        if (designItem.element instanceof ZplGraphicCircle) return circleHandles;
        // Diagonals use ZplDiagonalLineExtension. Returning no generic resize
        // handles keeps rectangle-based resize semantics out of endpoint editing.
        return [];
    }

    begin(context: ElementResizeContext): GraphicResizeState {
        const element = context.designItem.element as HTMLElement;
        return {
            originalWidth: element.style.width,
            originalHeight: element.style.height,
            originalLeft: element.style.left,
            originalTop: element.style.top,
            originalRight: element.style.right,
            originalBottom: element.style.bottom
        };
    }

    preview(context: ElementResizeContext, rawState: unknown): ElementResizePreview {
        void rawState;
        const element = context.designItem.element as HTMLElement;
        const crossedX = context.currentSize.width < 0;
        const crossedY = context.currentSize.height < 0;
        const width = Math.max(1, Math.abs(context.currentSize.width));
        const height = Math.max(1, Math.abs(context.currentSize.height));
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;

        return {
            width,
            height,
            anchorHandle: crossedHandle(context.handle, crossedX, crossedY)
        };
    }

    commit(context: ElementResizeContext, rawState: unknown): void {
        const state = rawState as GraphicResizeState;
        const element = context.designItem.element as HTMLElement;
        const width = element.style.width;
        const height = element.style.height;
        element.style.width = state.originalWidth;
        element.style.height = state.originalHeight;
        context.designItem.setStyle('width', width);
        context.designItem.setStyle('height', height);
    }

    cancel(context: ElementResizeContext, rawState: unknown): void {
        const state = rawState as GraphicResizeState;
        const element = context.designItem.element as HTMLElement;
        element.style.width = state.originalWidth;
        element.style.height = state.originalHeight;
        element.style.left = state.originalLeft;
        element.style.top = state.originalTop;
        element.style.right = state.originalRight;
        element.style.bottom = state.originalBottom;
    }
}
