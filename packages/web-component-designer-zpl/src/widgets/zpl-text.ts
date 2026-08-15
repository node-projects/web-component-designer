import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { applyDeviceFontCase, getDeviceFontMetrics, loadZplFonts, ZplFontName, zplFontFamilies } from '../fonts/zplFonts.js';
import { getZplCoordinates } from '../zplHelper.js';

type ZplRotation = 'N' | 'R' | 'I' | 'B';

/** Align the browser font's visible ink with the ZPL field origin. */
export const zplTextPreviewYOffset = -7;

export class ZplText extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
        :host { display: block; min-width: 1px; min-height: 1px; }
        #text-frame { position: relative; transform-origin: 0 0; width: max-content; height: max-content; }
        #text-div { display: inline-block; white-space: pre; transform-origin: 0 0; line-height: 1; }
    `;

    static override readonly template = html`<div id="text-frame"><div id="text-div"></div></div>`;
    static readonly is = 'zpl-text';
    static get observedAttributes() {
        return ['content', 'font-name', 'font-height', 'font-width', 'rotation'];
    }

    public content = '';
    public fontName: ZplFontName = '0';
    public fontHeight = 30;
    public fontWidth = 30;
    public rotation: ZplRotation = 'N';

    private _text: HTMLDivElement;
    private _frame: HTMLDivElement;
    private _fontLoadStarted = false;
    private _widgetReady = false;

    static readonly properties = {
        content: String, fontName: String, fontHeight: Number, fontWidth: Number, rotation: String
    };

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._text = this._getDomElement<HTMLDivElement>('text-div');
        this._frame = this._getDomElement<HTMLDivElement>('text-frame');
    }

    ready() {
        this._widgetReady = true;
        this.refreshFromAttributes();
        this._ensureFontsLoaded();
    }

    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue || !this._widgetReady) return;
        this.refreshFromAttributes();
    }

    /** Called by the property service as well as native attribute callbacks. */
    public refreshFromAttributes() {
        this._parseAttributesToProperties();
        this.renderText();
    }

    public renderText() {
        const font = /^[0A-H]$/.test(this.fontName) ? this.fontName : '0';
        const metrics = getDeviceFontMetrics(font, this.fontHeight, this.fontWidth);
        const fontSize = metrics?.fontSize ?? Math.max(1, this.fontHeight);
        const scaleX = metrics?.scaleX ?? (this.fontWidth > 0 ? this.fontWidth / this.fontHeight : 1);
        this._text.textContent = applyDeviceFontCase(font, this.content ?? '');
        this._text.style.fontFamily = `"${zplFontFamilies[font]}", monospace`;
        this._text.style.fontSize = `${fontSize}px`;
        this._text.style.fontWeight = font === '0' ? 'bold' : 'normal';
        this._text.style.letterSpacing = `${metrics?.letterSpacing ?? 0}px`;
        const previewYOffset = (metrics?.yOffset ?? 0) + zplTextPreviewYOffset;
        this._text.style.transform = `translate(${metrics?.xOffset ?? 0}px, ${previewYOffset}px) scaleX(${scaleX})`;

        // Force layout here. Resize strategies need the quantized bounds in the
        // same pointer event, rather than one animation frame later.
        const rawWidth = Math.max(1, this._text.scrollWidth);
        const width = Math.max(1, rawWidth * scaleX + Math.abs(metrics?.xOffset ?? 0));
        const height = Math.max(1, fontSize + Math.abs(metrics?.yOffset ?? 0));
        this._setRotatedBounds(width, height, this.rotation);
    }

    private _ensureFontsLoaded() {
        if (this._fontLoadStarted) return;
        this._fontLoadStarted = true;
        void loadZplFonts(this.ownerDocument)
            .then(() => this.renderText())
            .catch(() => { /* fallback families remain usable */ });
    }

    private _setRotatedBounds(width: number, height: number, rotation: ZplRotation) {
        this._frame.style.width = `${width}px`;
        this._frame.style.height = `${height}px`;
        this._frame.style.transform = '';
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
        return `${getZplCoordinates(this, 0)}^A${this.fontName}${this.rotation},${this.fontHeight},${this.fontWidth}^FD${this.content}^FS`;
    }
}

customElements.define(ZplText.is, ZplText);
