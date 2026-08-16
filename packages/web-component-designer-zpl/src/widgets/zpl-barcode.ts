import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { getZplCoordinates } from '../zplHelper.js';
import { BarcodeProps, BarcodeRotation, BarcodeType, barcodeObservedAttributes, getBarcodeDefinition, getBarcodeFieldOriginOffset, readBarcodeProps } from '../barcodes/barcodeRegistry.js';
import { barcodeFieldOriginAboveOffset, barcodeHorizontalInsets, barcodeInterpretationText, barcodeShowsInterpretation,
    barcodeTextAbove, barcodeTextZoneDots, eanUpcTypes, getEanUpcHriFragments, getEanUpcHriStyle,
    renderBarcode } from '../barcodes/bwipRenderer.js';

export class ZplBarcode extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
        :host { display: block; min-width: 1px; min-height: 1px; }
        * { box-sizing: border-box; }
        #barcode-frame { position: relative; transform-origin: 0 0; }
        canvas { display: block; image-rendering: pixelated; }
        #hri { position: absolute; left: 0; width: 100%; text-align: center; color: black;
            font-family: "ZplVeraMono", monospace; white-space: nowrap; }
        #hri.ean-upc { text-align: left; overflow: visible; }
        #hri.ean-upc > span { position: absolute; top: 0; text-align: center; }
        #error { width: 160px; min-height: 48px; padding: 6px; border: 1px dashed #c62828;
            color: #8e0000; background: #fff4f4; font: 11px sans-serif; overflow: hidden; }
    `;

    static override readonly template = html`
        <div id="barcode-frame"><div id="barcode-surface"></div><div id="hri"></div><div id="error" hidden></div></div>
    `;

    static readonly is = 'zpl-barcode';
    static get observedAttributes() { return barcodeObservedAttributes; }

    public content = '';
    public type: BarcodeType = 'code128';
    public rotation: BarcodeRotation = 'N';
    public moduleWidth = 2;
    public wideRatio = 3;
    public barHeight = 100;
    public printInterpretation = true;
    public printInterpretationAbove = false;
    public checkDigit = false;
    public magnification = 4;
    public dimension = 5;
    public rowHeight = 2;
    public columns = 0;
    public rows = 0;
    public mode: string | number = 0;
    public securityLevel: string | number = 0;
    public errorCorrection = 'Q';
    public quality = 200;
    public gs1 = false;
    public aspectRatio = 1;
    public symbology = 1;
    public segments = 22;
    public ecLevel = 0;
    public model = 2;
    public symbolNumber = 1;
    public symbolTotal = 1;
    public microPdfModuleWidth = 2;
    public microPdfRowHeight = 4;

    static readonly properties = {
        content: String, type: String, rotation: String, moduleWidth: Number, wideRatio: Number,
        barHeight: Number, printInterpretation: Boolean, printInterpretationAbove: Boolean,
        checkDigit: Boolean, magnification: Number, dimension: Number, rowHeight: Number,
        columns: Number, rows: Number, mode: String, securityLevel: String,
        errorCorrection: String, quality: Number, gs1: Boolean, aspectRatio: Number,
        symbology: Number, segments: Number, ecLevel: Number, model: Number,
        symbolNumber: Number, symbolTotal: Number, microPdfModuleWidth: Number,
        microPdfRowHeight: Number
    };

    private _surface: HTMLDivElement;
    private _frame: HTMLDivElement;
    private _hri: HTMLDivElement;
    private _error: HTMLDivElement;
    private _widgetReady = false;

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._surface = this._getDomElement<HTMLDivElement>('barcode-surface');
        this._frame = this._getDomElement<HTMLDivElement>('barcode-frame');
        this._hri = this._getDomElement<HTMLDivElement>('hri');
        this._error = this._getDomElement<HTMLDivElement>('error');
    }

    ready() {
        this._widgetReady = true;
        this.refreshFromAttributes();
    }

    public refreshFromAttributes() {
        this._parseAttributesToProperties();
        this.renderBarcode();
    }

    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue || !this._widgetReady) return;
        this.refreshFromAttributes();
    }

    public get barcodeProps(): BarcodeProps {
        return readBarcodeProps(this);
    }

    public renderBarcode() {
        const props = this.barcodeProps;
        const definition = getBarcodeDefinition(props.type);
        const result = renderBarcode(props);
        this._surface.replaceChildren();
        this._hri.replaceChildren();
        this._hri.hidden = true;
        this._hri.className = '';
        this._hri.style.left = '';
        this._hri.style.width = '';
        this._hri.style.fontFamily = '';
        this._hri.style.textAlign = '';
        this._error.hidden = true;
        this._frame.style.transform = '';
        this._frame.style.width = '';
        this._frame.style.height = '';
        this._surface.style.position = '';
        this._surface.style.left = '';
        this._surface.style.top = '';

        if (!result.canvas) {
            this._error.textContent = `${definition.label}: ${result.error ?? 'cannot render this value'}`;
            this._error.hidden = false;
            this._setRotatedBounds(160, 48, props.rotation);
            return;
        }

        const canvas = result.canvas;
        const uprightWidth = result.width;
        const horizontalInsets = barcodeHorizontalInsets(props);
        let uprightHeight = result.height;
        if (definition.resizeKind === 'linear') {
            const linear = props as Extract<BarcodeProps, { barHeight: number }>;
            const isEanUpc = eanUpcTypes.has(props.type);
            canvas.style.width = `${uprightWidth - horizontalInsets.left - horizontalInsets.right}px`;
            canvas.style.height = `${linear.barHeight + (isEanUpc ? 13 : 0)}px`;
            uprightHeight = linear.barHeight;
            const showHri = barcodeShowsInterpretation(props);
            const textZone = barcodeTextZoneDots(props);
            const textAbove = barcodeTextAbove(props);
            if (textAbove && textZone > 0) {
                this._surface.style.position = 'absolute';
                this._surface.style.left = `${horizontalInsets.left}px`;
                this._surface.style.top = `${textZone}px`;
            } else if (horizontalInsets.left > 0) {
                this._surface.style.position = 'absolute';
                this._surface.style.left = `${horizontalInsets.left}px`;
                this._surface.style.top = '0';
            }
            if (showHri) {
                const genericHri = ['code128', 'code39', 'code93', 'code11', 'interleaved2of5',
                    'standard2of5', 'industrial2of5', 'codabar', 'msi'].includes(props.type);
                const eanStyle = isEanUpc ? getEanUpcHriStyle(linear.moduleWidth) : null;
                const hriFontSize = eanStyle?.fontSize ?? (genericHri ? 9.7 * Math.max(1, Math.round(linear.moduleWidth)) : 12);
                this._hri.style.height = `${textZone}px`;
                this._hri.style.fontSize = `${hriFontSize}px`;
                this._hri.style.lineHeight = `${hriFontSize}px`;
                this._hri.style.fontFamily = eanStyle ? eanStyle.fontFamily : '';
                this._hri.style.letterSpacing = genericHri ? '.6px' : 'normal';
                this._hri.style.transform = genericHri ? 'translateX(-3px)' : '';
                if (isEanUpc && !textAbove && eanStyle) {
                    const barWidth = uprightWidth - horizontalInsets.left - horizontalInsets.right;
                    this._hri.className = 'ean-upc';
                    this._hri.style.left = `${horizontalInsets.left}px`;
                    this._hri.style.width = `${barWidth}px`;
                    this._hri.style.top = `${uprightHeight + eanStyle.gap}px`;
                    for (const fragment of getEanUpcHriFragments(props)) {
                        const digit = document.createElement('span');
                        digit.textContent = fragment.char;
                        digit.style.left = `${(fragment.xModule - 1) * linear.moduleWidth - hriFontSize / 2}px`;
                        digit.style.width = `${hriFontSize}px`;
                        this._hri.appendChild(digit);
                    }
                } else {
                    this._hri.textContent = barcodeInterpretationText(props);
                    // Zebra keeps a roughly five-dot bar-to-cap gap. Vera Mono's
                    // cap top sits about .14em below its line-box top. The DOM
                    // rasterizer needs three extra dots to match the printer cap.
                    const belowTop = uprightHeight + 8 - hriFontSize * .14;
                    this._hri.style.top = textAbove ? '0' : `${belowTop}px`;
                }
                this._hri.hidden = false;
            }
            uprightHeight += textZone;
        }
        this._surface.appendChild(canvas);
        this._setRotatedBounds(uprightWidth, uprightHeight, props.rotation);
    }

    private _setRotatedBounds(width: number, height: number, rotation: BarcodeRotation) {
        this._frame.style.width = `${width}px`;
        this._frame.style.height = `${height}px`;
        switch (rotation) {
            case 'R':
                this._frame.style.transform = `translateX(${height}px) rotate(90deg)`;
                this.style.width = `${height}px`; this.style.height = `${width}px`;
                break;
            case 'I':
                this._frame.style.transform = `translate(${width}px, ${height}px) rotate(180deg)`;
                this.style.width = `${width}px`; this.style.height = `${height}px`;
                break;
            case 'B':
                this._frame.style.transform = `translateY(${width}px) rotate(270deg)`;
                this.style.width = `${height}px`; this.style.height = `${width}px`;
                break;
            default:
                this.style.width = `${width}px`; this.style.height = `${height}px`;
        }
    }

    public createZpl() {
        const props = this.barcodeProps;
        const emitted = getBarcodeDefinition(props.type).emit(props);
        const offset = getBarcodeFieldOriginOffset(props.type, props.rotation);
        const aboveOffset = props.rotation === 'N' ? barcodeFieldOriginAboveOffset(props) : 0;
        const horizontalOffset = props.rotation === 'N' ? barcodeHorizontalInsets(props).left : 0;
        return `${getZplCoordinates(this, 0, offset.x + horizontalOffset, offset.y + aboveOffset)}${emitted.by ?? ''}${emitted.command}^FD${emitted.fieldData}^FS`;
    }
}

customElements.define(ZplBarcode.is, ZplBarcode);
