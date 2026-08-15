import { css } from '@node-projects/base-custom-webcomponent';
import {
    AbstractExtension, EventNames, IDesignItem, IDesignerCanvas, IDesignerExtension,
    IDesignerExtensionProvider, IExtensionManager, IPoint, OverlayLayer
} from '@node-projects/web-component-designer';
import { ZplGraphicDiagonalLine } from '../widgets/zpl-graphic-diagonal-line.js';

export type ZplDiagonalOrientation = 'L' | 'R';

export interface ZplDiagonalEndpoints {
    first: IPoint;
    second: IPoint;
}

export interface ZplDiagonalResizeResult {
    endpoints: ZplDiagonalEndpoints;
    left: number;
    top: number;
    width: number;
    height: number;
    orientation: ZplDiagonalOrientation;
}

export function getZplDiagonalVisibleHeight(elementHeight: number, lineStrokeWidth: number): number {
    return Math.max(0, elementHeight - Math.max(0, lineStrokeWidth));
}

export function getZplDiagonalElementHeight(visibleHeight: number, lineStrokeWidth: number): number {
    return Math.max(0, visibleHeight) + Math.max(0, lineStrokeWidth);
}

interface DiagonalDragState {
    draggedEndpoint: 0 | 1;
    startPointer: IPoint;
    originalCssEndpoints: ZplDiagonalEndpoints;
    originalOverlayEndpoints: ZplDiagonalEndpoints;
    overlayEndpoints: ZplDiagonalEndpoints;
    originalStyles: Record<'left' | 'top' | 'right' | 'bottom' | 'width' | 'height', string>;
    originalOrientation: string | null;
    changed: boolean;
}

function orientationForEndpoints(endpoints: ZplDiagonalEndpoints, fallback: ZplDiagonalOrientation): ZplDiagonalOrientation {
    const dx = endpoints.second.x - endpoints.first.x;
    const dy = endpoints.second.y - endpoints.first.y;
    if (dx === 0 || dy === 0) return fallback;
    return dx * dy > 0 ? 'L' : 'R';
}

export function getZplDiagonalEndpoints(
    left: number, top: number, width: number, height: number, orientation: ZplDiagonalOrientation
): ZplDiagonalEndpoints {
    return orientation === 'R'
        ? { first: { x: left, y: top + height }, second: { x: left + width, y: top } }
        : { first: { x: left, y: top }, second: { x: left + width, y: top + height } };
}

/**
 * Moves one line endpoint by a gesture delta. The other endpoint is copied
 * unchanged; bounds and ZPL orientation are derived from the resulting line.
 */
export function resizeZplDiagonalEndpoint(
    original: ZplDiagonalEndpoints,
    draggedEndpoint: 0 | 1,
    delta: IPoint,
    fallbackOrientation: ZplDiagonalOrientation
): ZplDiagonalResizeResult {
    const endpoints: ZplDiagonalEndpoints = {
        first: { ...original.first },
        second: { ...original.second }
    };
    const dragged = draggedEndpoint === 0 ? endpoints.first : endpoints.second;
    const originalDragged = draggedEndpoint === 0 ? original.first : original.second;
    dragged.x = originalDragged.x + delta.x;
    dragged.y = originalDragged.y + delta.y;

    const left = Math.min(endpoints.first.x, endpoints.second.x);
    const top = Math.min(endpoints.first.y, endpoints.second.y);
    return {
        endpoints,
        left,
        top,
        width: Math.abs(endpoints.second.x - endpoints.first.x),
        height: Math.abs(endpoints.second.y - endpoints.first.y),
        orientation: orientationForEndpoints(endpoints, fallbackOrientation)
    };
}

function numericStyle(element: HTMLElement, name: 'left' | 'top' | 'width' | 'height'): number {
    const inline = parseFloat(element.style.getPropertyValue(name));
    if (Number.isFinite(inline)) return inline;
    const computed = parseFloat(getComputedStyle(element).getPropertyValue(name));
    return Number.isFinite(computed) ? computed : 0;
}

function strokeWidth(element: HTMLElement): number {
    const value = Number(element.getAttribute('stroke-width'));
    return Number.isFinite(value) ? Math.max(0, value) : 1;
}

function px(value: number): string {
    return `${Math.round(value)}px`;
}

export class ZplDiagonalLineExtension extends AbstractExtension {
    private _firstHandle?: SVGCircleElement;
    private _secondHandle?: SVGCircleElement;
    private _dragState?: DiagonalDragState;
    private readonly _eventCleanups: (() => void)[] = [];

    constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem) {
        super(extensionManager, designerCanvas, extendedItem);
    }

    override extend() {
        this.refresh();
    }

    override refresh() {
        const endpoints = this._dragState?.overlayEndpoints ?? this._readOverlayEndpoints();
        const radius = 5 / this.designerCanvas.scaleFactor;
        this._firstHandle = this._drawHandle(endpoints.first, 0, radius, this._firstHandle);
        this._secondHandle = this._drawHandle(endpoints.second, 1, radius, this._secondHandle);
    }

    override dispose() {
        for (const cleanup of this._eventCleanups) cleanup();
        this._eventCleanups.length = 0;
        this._removeAllOverlays();
        this._firstHandle = undefined;
        this._secondHandle = undefined;
        this._dragState = undefined;
    }

    private _drawHandle(point: IPoint, endpoint: 0 | 1, radius: number, oldHandle?: SVGCircleElement): SVGCircleElement {
        const handle = this._drawCircle(point.x, point.y, radius, 'svg-zpl-line-endpoint', oldHandle, OverlayLayer.Foreground);
        handle.style.strokeWidth = `${1 / this.designerCanvas.zoomFactor}`;
        handle.style.cursor = 'move';
        if (!oldHandle) {
            const down = (event: PointerEvent) => this._pointerDown(event, handle, endpoint);
            const move = (event: PointerEvent) => this._pointerMove(event, endpoint);
            const up = (event: PointerEvent) => this._pointerUp(event);
            const cancel = (event: PointerEvent) => this._pointerCancel(event);
            handle.addEventListener(EventNames.PointerDown, down);
            handle.addEventListener(EventNames.PointerMove, move);
            handle.addEventListener(EventNames.PointerUp, up);
            handle.addEventListener('pointercancel', cancel);
            this._eventCleanups.push(
                () => handle.removeEventListener(EventNames.PointerDown, down),
                () => handle.removeEventListener(EventNames.PointerMove, move),
                () => handle.removeEventListener(EventNames.PointerUp, up),
                () => handle.removeEventListener('pointercancel', cancel)
            );
        }
        return handle;
    }

    private _pointerDown(event: PointerEvent, handle: SVGCircleElement, endpoint: 0 | 1) {
        event.stopPropagation();
        event.preventDefault();
        handle.setPointerCapture(event.pointerId);
        const element = this.extendedItem.element as HTMLElement;
        this._dragState = {
            draggedEndpoint: endpoint,
            startPointer: this.designerCanvas.getNormalizedEventCoordinates(event),
            originalCssEndpoints: this._readCssEndpoints(),
            originalOverlayEndpoints: this._readOverlayEndpoints(),
            overlayEndpoints: this._readOverlayEndpoints(),
            originalStyles: {
                left: element.style.left,
                top: element.style.top,
                right: element.style.right,
                bottom: element.style.bottom,
                width: element.style.width,
                height: element.style.height
            },
            originalOrientation: element.getAttribute('orientation'),
            changed: false
        };
    }

    private _pointerMove(event: PointerEvent, endpoint: 0 | 1) {
        event.stopPropagation();
        event.preventDefault();
        const state = this._dragState;
        if (!state || state.draggedEndpoint !== endpoint || event.buttons === 0) return;

        const current = this.designerCanvas.getNormalizedEventCoordinates(event);
        const delta = { x: current.x - state.startPointer.x, y: current.y - state.startPointer.y };
        if (event.shiftKey) {
            if (Math.abs(delta.x) >= Math.abs(delta.y)) delta.y = 0;
            else delta.x = 0;
        }

        const orientation = state.originalOrientation === 'R' ? 'R' : 'L';
        const result = resizeZplDiagonalEndpoint(state.originalCssEndpoints, endpoint, delta, orientation);
        const roundedDelta = {
            x: Math.round((endpoint === 0 ? result.endpoints.first : result.endpoints.second).x)
                - (endpoint === 0 ? state.originalCssEndpoints.first.x : state.originalCssEndpoints.second.x),
            y: Math.round((endpoint === 0 ? result.endpoints.first : result.endpoints.second).y)
                - (endpoint === 0 ? state.originalCssEndpoints.first.y : state.originalCssEndpoints.second.y)
        };
        state.overlayEndpoints = {
            first: { ...state.originalOverlayEndpoints.first },
            second: { ...state.originalOverlayEndpoints.second }
        };
        const overlayDragged = endpoint === 0 ? state.overlayEndpoints.first : state.overlayEndpoints.second;
        const originalOverlayDragged = endpoint === 0 ? state.originalOverlayEndpoints.first : state.originalOverlayEndpoints.second;
        overlayDragged.x = originalOverlayDragged.x + roundedDelta.x;
        overlayDragged.y = originalOverlayDragged.y + roundedDelta.y;

        const element = this.extendedItem.element as HTMLElement;
        element.style.removeProperty('right');
        element.style.removeProperty('bottom');
        element.style.left = px(result.left);
        element.style.top = px(result.top);
        element.style.width = px(result.width);
        // ZplGraphicDiagonalLine keeps its stroke inside the host by drawing
        // the lower SVG endpoint at `height - strokeWidth`.
        element.style.height = px(getZplDiagonalElementHeight(result.height, strokeWidth(element)));
        element.setAttribute('orientation', result.orientation);
        state.changed = true;

        this.refresh();
        this.extensionManager.refreshAllExtensions([this.extendedItem, this.extendedItem.parent], this);
        this.designerCanvas.raiseDesignItemsChanged([this.extendedItem], 'resize', false);
    }

    private _pointerUp(event: PointerEvent) {
        event.stopPropagation();
        (event.target as Element).releasePointerCapture(event.pointerId);
        const state = this._dragState;
        if (!state) return;
        if (state.changed) this._commit(state);
        this._dragState = undefined;
        this.refresh();
    }

    private _pointerCancel(event: PointerEvent) {
        event.stopPropagation();
        if (!this._dragState) return;
        this._restore(this._dragState);
        this._dragState = undefined;
        this.refresh();
        this.extensionManager.refreshAllExtensions([this.extendedItem, this.extendedItem.parent], this);
    }

    private _commit(state: DiagonalDragState) {
        const element = this.extendedItem.element as HTMLElement;
        const finalStyles = {
            left: element.style.left,
            top: element.style.top,
            width: element.style.width === '0px' ? '1px' : element.style.width,
            height: element.style.height === '0px' ? '1px' : element.style.height
        };
        const finalOrientation = element.getAttribute('orientation') ?? 'L';
        this._restore(state);

        const group = this.extendedItem.openGroup('Resize ZPL diagonal line');
        try {
            this.extendedItem.setStyle('right', null);
            this.extendedItem.setStyle('bottom', null);
            this.extendedItem.setStyle('left', finalStyles.left);
            this.extendedItem.setStyle('top', finalStyles.top);
            this.extendedItem.setStyle('width', finalStyles.width);
            this.extendedItem.setStyle('height', finalStyles.height);
            this.extendedItem.setAttribute('orientation', finalOrientation);
            group.commit();
            this.designerCanvas.raiseDesignItemsChanged([this.extendedItem], 'resize', true);
        } catch (error) {
            group.abort();
            throw error;
        }
    }

    private _restore(state: DiagonalDragState) {
        const element = this.extendedItem.element as HTMLElement;
        for (const [name, value] of Object.entries(state.originalStyles)) {
            if (value) element.style.setProperty(name, value);
            else element.style.removeProperty(name);
        }
        if (state.originalOrientation == null) element.removeAttribute('orientation');
        else element.setAttribute('orientation', state.originalOrientation);
    }

    private _readCssEndpoints(): ZplDiagonalEndpoints {
        const element = this.extendedItem.element as HTMLElement;
        return getZplDiagonalEndpoints(
            numericStyle(element, 'left'),
            numericStyle(element, 'top'),
            numericStyle(element, 'width'),
            getZplDiagonalVisibleHeight(numericStyle(element, 'height'), strokeWidth(element)),
            element.getAttribute('orientation') === 'R' ? 'R' : 'L'
        );
    }

    private _readOverlayEndpoints(): ZplDiagonalEndpoints {
        const element = this.extendedItem.element as HTMLElement;
        const rect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
        return getZplDiagonalEndpoints(
            rect.x, rect.y, rect.width, getZplDiagonalVisibleHeight(rect.height, strokeWidth(element)),
            this.extendedItem.getAttribute('orientation') === 'R' ? 'R' : 'L'
        );
    }
}

export class ZplDiagonalLineExtensionProvider implements IDesignerExtensionProvider {
    shouldExtend(_extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
        return !designerCanvas.readOnly && designItem.element.localName === ZplGraphicDiagonalLine.is;
    }

    getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
        return new ZplDiagonalLineExtension(extensionManager, designerCanvas, designItem);
    }

    readonly style = css`
        .svg-zpl-line-endpoint {
            stroke: #3899ec;
            fill: white;
            pointer-events: auto;
        }
    `;
}
