import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { requestAnimationFramePromise } from "@node-projects/web-component-designer";
import { getZplCoordinates } from "../zplHelper.js";

export class ZplImage extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css` *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="wrapper">
        <canvas id="image-div">
        </canvas>
    </div>
    `;

    static readonly is = 'zpl-image';


    private _image: HTMLCanvasElement;
    private _wrapper: HTMLDivElement;

    public totalBytes: number;
    public bytesPerRow: number;
    public imageName: string;
    public hexImage: string;
    public scaleX: number;
    public scaleY: number;

    static readonly properties = {
        totalBytes: Number,
        bytesPerRow: Number,
        imageName: String,
        hexImage: String,
        scaleX: Number,
        scaleY: Number,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._image = this._getDomElement<HTMLCanvasElement>("image-div");
        this._wrapper = this._getDomElement<HTMLDivElement>("wrapper");
    }

    async ready() {
        this._parseAttributesToProperties();
        if (this.scaleX < 1)
            this.scaleX = 1
        if (this.scaleY < 1)
            this.scaleY = 1
        if (this.scaleX > 10)
            this.scaleX = 10
        if (this.scaleX > 10)
            this.scaleX = 10
        if (this.hexImage && this.bytesPerRow)
            this.acsToCanvas(this.hexImage, this.bytesPerRow);
        // this._image.style.width = 100 * this.scaleX + "%";
        // this._image.style.aspectRatio = (this.scaleX / this.scaleY).toString();
        this._image.style.transformOrigin = "0 0";
        this._image.style.transform = "scaleX(" + this.scaleX + ") " + "scaleY(" + this.scaleY + ")";
        await requestAnimationFramePromise();
        let rect = this._image.getBoundingClientRect();
        this._wrapper.style.width = rect.width + "px";
        this._wrapper.style.height = rect.height + "px";

    }

    public createZplImage() {
        let zpl = "";
        zpl += "~DG" + this.imageName + ",";
        zpl += this.totalBytes + ",";
        zpl += this.bytesPerRow + ",";
        zpl += this.hexImage;
        zpl = zpl.replaceAll("\n", "");
        return zpl;
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        zpl += "^XG" + "R:" + this.imageName + "," + this.scaleX + "," + this.scaleY;
        zpl += "^FS";
        return zpl;
    }

    private acsToCanvas(imageData, bytesPerRow) {
        let hex = imageData.replaceAll(" ", "").replaceAll("\n", "").replaceAll("\r", "");
        hex = hex.replace(/[g-zG-Y]+([0-9a-fA-F])/g, ($0, $1) => {
            let rep = 0;
            for (let i = 0, l = $0.length - 1; i < l; i++) {
                let cd = $0.charCodeAt(i);
                if (cd < 90) { // 'Z'
                    rep += cd - 70;
                } else {
                    rep += (cd - 102) * 20;
                }
            }
            return $1.repeat(rep);
        });

        let bytes = Array(hex.length / 2);
        for (let i = 0, l = hex.length; i < l; i += 2) {
            bytes[i >> 1] = parseInt(hex.substr(i, 2), 16);
        }

        let l = bytes.length;
        let w = bytesPerRow * 8;		// rowl is in bytes
        let h = ~~(l / bytesPerRow);

        // Render the GRF to a canvas
        let cvs = this._image;
        cvs.width = w;
        cvs.height = h;

        let ctx = cvs.getContext('2d');
        let bmap = ctx.getImageData(0, 0, w, h);
        let data = bmap.data;
        let offs = 0;
        for (let i = 0; i < l; i++) {
            let byte = bytes[i];
            for (let bit = 0x80; bit; bit = bit >>> 1, offs += 4) {
                if (bit & byte) {
                    data[offs] = 0;
                    data[offs + 1] = 0;
                    data[offs + 2] = 0;
                    data[offs + 3] = 255;	// Fully opaque
                }
            }
        }
        ctx.putImageData(bmap, 0, 0);
        return cvs;
    }
}

customElements.define(ZplImage.is, ZplImage);
