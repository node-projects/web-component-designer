import {
    ElementResizeContext, IDesignItem, IElementResizeStrategy,
    ISize, ResizeHandle
} from '@node-projects/web-component-designer';
import { getBarcodeDefinition } from '../barcodes/barcodeRegistry.js';
import { ZplBarcode } from '../widgets/zpl-barcode.js';
import { ZplText } from '../widgets/zpl-text.js';
import { getDeviceFontMagnification, ZplFontName } from '../fonts/zplFonts.js';
import { quantizeZplValue, zplAxisScales } from './zplResizeGeometry.js';
export { quantizeZplValue, zplAxisScales } from './zplResizeGeometry.js';

interface ResizeState {
    originalAttributes: Map<string, string | null>;
    previewAttributes: Map<string, string>;
    originalWidth: string;
    originalHeight: string;
}

const allHandles: readonly ResizeHandle[] = ['nw-resize', 'n-resize', 'ne-resize', 'w-resize', 'sw-resize', 's-resize', 'e-resize', 'se-resize'];
const edgeHandles: readonly ResizeHandle[] = ['n-resize', 'w-resize', 's-resize', 'e-resize'];
const cornerHandles: readonly ResizeHandle[] = ['nw-resize', 'ne-resize', 'sw-resize', 'se-resize'];

const clamp = quantizeZplValue;

export class ZplElementResizeStrategy implements IElementResizeStrategy {
    isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof ZplText || designItem.element instanceof ZplBarcode;
    }

    getEnabledHandles(designItem: IDesignItem): readonly ResizeHandle[] {
        if (designItem.element instanceof ZplText) return allHandles;
        const definition = getBarcodeDefinition(designItem.getAttribute('type'));
        if (definition.resizeKind === 'intrinsic') return [];
        if (definition.resizeKind === 'uniform-2d') return cornerHandles;
        if (definition.resizeKind === 'linear') return edgeHandles;
        return allHandles;
    }

    begin(context: ElementResizeContext): ResizeState {
        const element = context.designItem.element as HTMLElement;
        return {
            originalAttributes: new Map(),
            previewAttributes: new Map(),
            originalWidth: element.style.width,
            originalHeight: element.style.height
        };
    }

    preview(context: ElementResizeContext, rawState: unknown): ISize {
        const state = rawState as ResizeState;
        const element = context.designItem.element as HTMLElement;
        const attributes = element instanceof ZplText
            ? this._textAttributes(element, context, state)
            : this._barcodeAttributes(element as ZplBarcode, context, state);
        for (const [name, value] of Object.entries(attributes)) {
            if (!state.originalAttributes.has(name)) state.originalAttributes.set(name, element.getAttribute(name));
            state.previewAttributes.set(name, value);
            element.setAttribute(name, value);
        }
        // ResizeExtension writes a temporary CSS box before invoking the ZPL
        // strategy. When quantization keeps every attribute unchanged, native
        // attribute callbacks do not fire and that temporary box would survive
        // until the next device-font/barcode threshold, causing a large jump.
        if (element instanceof ZplText) element.renderText();
        else (element as ZplBarcode).renderBarcode();
        const bounds = element.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
    }

    commit(context: ElementResizeContext, rawState: unknown): void {
        const state = rawState as ResizeState;
        const element = context.designItem.element as HTMLElement;
        this._restoreRaw(element, state);
        for (const [name, value] of state.previewAttributes) context.designItem.setAttribute(name, value);
    }

    cancel(context: ElementResizeContext, rawState: unknown): void {
        this._restoreRaw(context.designItem.element as HTMLElement, rawState as ResizeState);
    }

    private _restoreRaw(element: HTMLElement, state: ResizeState) {
        for (const [name, value] of state.originalAttributes) {
            if (value == null) element.removeAttribute(name);
            else element.setAttribute(name, value);
        }
        element.style.width = state.originalWidth;
        element.style.height = state.originalHeight;
        if (element instanceof ZplBarcode) element.renderBarcode();
        else if (element instanceof ZplText) element.renderText();
    }

    private _initialNumber(state: ResizeState, element: Element, name: string, fallback: number) {
        if (!state.originalAttributes.has(name)) state.originalAttributes.set(name, element.getAttribute(name));
        const value = Number(state.originalAttributes.get(name));
        return Number.isFinite(value) && value > 0 ? value : fallback;
    }

    private _textAttributes(element: ZplText, context: ElementResizeContext, state: ResizeState): Record<string, string> {
        const scales = zplAxisScales(element.getAttribute('rotation'), context.initialSize, context.currentSize);
        const fontWidthScale = scales.width;
        const fontHeightScale = scales.height;
        if (!state.originalAttributes.has('font-width')) state.originalAttributes.set('font-width', element.getAttribute('font-width'));
        const originalWidth = Number(state.originalAttributes.get('font-width'));
        const originalHeight = this._initialNumber(state, element, 'font-height', 30);
        const font = (element.getAttribute('font-name') || '0') as ZplFontName;
        const deviceFont = getDeviceFontMagnification(font, originalHeight, originalWidth);
        if (deviceFont) {
            // Bitmap fonts A-H can only change in integer cell
            // magnifications. Scale the magnification visible at gesture start,
            // not the raw requested dot value: e.g. Font A height 30 renders at
            // 3x and must not jump to 4x after a two-dot drag.
            const heightMagnification = clamp(deviceFont.height * fontHeightScale, 1, 10);
            const widthMagnification = clamp(deviceFont.width * fontWidthScale, 1, 10);
            const fontHeight = heightMagnification === deviceFont.height
                ? originalHeight
                : heightMagnification * deviceFont.heightStep;
            let fontWidth: number;
            if (!(originalWidth > 0) && widthMagnification === heightMagnification) {
                fontWidth = 0;
            } else if (originalWidth > 0 && widthMagnification === deviceFont.width) {
                fontWidth = originalWidth;
            } else {
                fontWidth = widthMagnification * deviceFont.widthStep;
            }
            return {
                'font-width': String(fontWidth),
                'font-height': String(fontHeight)
            };
        }
        const fontHeight = clamp(originalHeight * fontHeightScale, 1, 32000);
        let fontWidth: number;
        if (Number.isFinite(originalWidth) && originalWidth > 0) {
            fontWidth = clamp(originalWidth * fontWidthScale, 1, 32000);
        } else if (Math.abs(fontWidthScale - fontHeightScale) < .01) {
            // A proportional resize keeps Zebra's automatic-width semantics.
            fontWidth = 0;
        } else {
            const residualScale = fontWidthScale / Math.max(.01, fontHeightScale);
            fontWidth = clamp(fontHeight * residualScale, 1, 32000);
        }
        return {
            'font-width': String(fontWidth),
            'font-height': String(fontHeight)
        };
    }

    private _barcodeAttributes(element: ZplBarcode, context: ElementResizeContext, state: ResizeState): Record<string, string> {
        const definition = getBarcodeDefinition(element.getAttribute('type'));
        const defaults = definition.defaults;
        const screenWidthScale = context.currentSize.width / Math.max(1, context.initialSize.width);
        const screenHeightScale = context.currentSize.height / Math.max(1, context.initialSize.height);
        const scales = zplAxisScales(element.getAttribute('rotation'), context.initialSize, context.currentSize);
        const widthScale = scales.width;
        const heightScale = scales.height;

        if (definition.resizeKind === 'uniform-2d') {
            const scale = Math.min(screenWidthScale, screenHeightScale);
            const attribute = definition.type === 'datamatrix' ? 'dimension' : 'magnification';
            return { [attribute]: String(clamp(this._initialNumber(state, element, attribute, Number(defaults[attribute] ?? 4)) * scale, 1, definition.type === 'datamatrix' ? 12 : 10)) };
        }
        if (definition.resizeKind === 'stacked-2d') {
            return {
                'module-width': String(clamp(this._initialNumber(state, element, 'module-width', Number(defaults.moduleWidth ?? 2)) * widthScale, definition.type === 'codablock' || definition.type === 'pdf417' ? 2 : 1, 10)),
                'row-height': String(clamp(this._initialNumber(state, element, 'row-height', Number(defaults.rowHeight ?? 2)) * heightScale, 1, 9999))
            };
        }
        if (definition.resizeKind === 'tlc39') {
            return {
                'module-width': String(clamp(this._initialNumber(state, element, 'module-width', Number(defaults.moduleWidth ?? 2)) * widthScale, 1, 10)),
                'bar-height': String(clamp(this._initialNumber(state, element, 'bar-height', Number(defaults.barHeight ?? 40)) * heightScale, 1, 32000)),
                'micro-pdf-module-width': String(clamp(this._initialNumber(state, element, 'micro-pdf-module-width', Number(defaults.microPdfModuleWidth ?? 2)) * widthScale, 1, 10)),
                'micro-pdf-row-height': String(clamp(this._initialNumber(state, element, 'micro-pdf-row-height', Number(defaults.microPdfRowHeight ?? 4)) * heightScale, 1, 9999))
            };
        }
        const initialModuleWidth = this._initialNumber(state, element, 'module-width', Number(defaults.moduleWidth ?? 2));
        const moduleWidth = clamp(initialModuleWidth * widthScale, 1, 10);
        let barHeight = clamp(this._initialNumber(state, element, 'bar-height', Number(defaults.barHeight ?? 100)) * heightScale, 1, 32000);
        if (definition.type === 'code49') barHeight = clamp(barHeight, moduleWidth * 8, moduleWidth * 50);
        const attributes = { 'module-width': String(moduleWidth), 'bar-height': String(barHeight) };
        if (definition.properties.some(property => property.attributeName === 'wide-ratio')) {
            const residualScale = widthScale / Math.max(.1, moduleWidth / initialModuleWidth);
            const wideRatio = Math.max(2, Math.min(3, Math.round(this._initialNumber(state, element, 'wide-ratio', Number(defaults.wideRatio ?? 3)) * residualScale * 10) / 10));
            return { ...attributes, 'wide-ratio': String(wideRatio) };
        }
        return attributes;
    }
}
