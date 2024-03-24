import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from "@node-projects/base-custom-webcomponent";
import { BarcodeFormat, BarcodeOptions } from "../jsBarcodeOptions.js";
import { getZplCoordinates } from "../zplHelper.js";
import QRCode from "../qr.js";

export class ZplBarcode extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css` *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="barcode-div" style="width: 100%; height: 100%;">
    </div>
    `;

    static readonly is = 'zpl-barcode';

    public content: string;
    public type: BarcodeFormat;
    public width: number;
    public ratio: number;
    public height: number;

    private _barcode: HTMLDivElement;
    private _barcodeOptions: BarcodeOptions;

    static readonly properties = {
        content: String,
        type: BarcodeFormat,
        width: Number,
        ratio: Number,
        height: Number,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._barcode = this._getDomElement<HTMLDivElement>("barcode-div");
    }

    async ready() {
        this._parseAttributesToProperties();
        if (this.width > 10)
            this.width = 10;
        if (this.width < 1)
            this.width = 1;
        if (this.ratio > 3.0)
            this.ratio = 3.0;
        if (this.ratio < 2.0)
            this.ratio = 2.0;
        if (this.type == BarcodeFormat.QR) {
            const svg = QRCode.generateSVG(this.content, {
                modulesize: this.height,
                margin: 0,
                background: 'transparent'
            });
            this._barcode.appendChild(svg);
            this._barcode.style.marginTop = "10px";
        } else {
            const packageurl = new URL("../../../../jsbarcode/dist/JsBarcode.all.js", import.meta.url);
            await LazyLoader.LoadJavascript(packageurl.toString());
            let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this._barcode.appendChild(svg);
            this._barcode.style.marginTop = "";

            this._createOptions();
            //@ts-ignore
            JsBarcode(svg, this.content, this._barcodeOptions);
        }
    }

    private _createOptions() {
        this._barcodeOptions = {}
        this._barcodeOptions.format = this.type;
        this._barcodeOptions.width = this.width;
        this._barcodeOptions.height = this.height;
        this._barcodeOptions.margin = 0;
        this._barcodeOptions.background = 'transparent';
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        if (this.type != BarcodeFormat.QR)
            zpl += "^BY" + this.width + "," + this.ratio;
        switch (this.type) {
            case BarcodeFormat.CODE128:
                zpl += "^BCN," + this.height + ",Y,N,Y,N";
                break;
            case BarcodeFormat.EAN13:
                zpl += "^BCN," + this.height + ",Y,N";
                break;
            case BarcodeFormat.QR:
                zpl += "^BQN,2," + this.height + "";
                break;
        }

        zpl += "^FD";
        if (this.type == BarcodeFormat.QR) 
            zpl += 'QA,'; // bar code configuration prefix
        zpl += this.content;
        zpl += "^FS";
        return zpl;
    }
}

customElements.define(ZplBarcode.is, ZplBarcode);
