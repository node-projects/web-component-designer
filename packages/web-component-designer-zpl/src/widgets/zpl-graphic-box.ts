import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { getZplCoordinates } from "../zplHelper.js";

enum StrokeColor {
    black = "black",
    white = "white",
}

export class ZplGraphicBox extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css` *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="box-div" style="width: 100%; height: 100%; overflow: hidden">
    </div>
    `;

    static readonly is = 'zpl-graphic-box';
    static get observedAttributes() { return ['stroke-width', 'stroke-color', 'corner-rounding', 'filled', 'reverse']; }

    public strokeWidth: number = 1;
    public strokeColor: string = 'black';
    public cornerRounding: number;
    public filled: boolean = false;
    public reverse: boolean = false;

    private _box: HTMLDivElement;
    private _observer: ResizeObserver;

    static readonly properties = {
        strokeWidth: Number,
        strokeColor: StrokeColor,
        cornerRounding: Number,
        filled: {
            type: Boolean,
            description: 'Fill the complete box. ZPL encodes this by using at least the shorter side as ^GB thickness.'
        },
        reverse: {
            type: Boolean,
            description: 'Invert this graphic field against objects printed before it (^FR).'
        },
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._box = this._getDomElement<HTMLDivElement>("box-div");
        this._observer = new ResizeObserver(() => this._drawSvg());
        this._observer.observe(this);
    }

    async ready() {
        this._parseAttributesToProperties();
        if (this.cornerRounding > 8)
            this.cornerRounding = 8;
        if (this.cornerRounding < 0)
            this.cornerRounding = 0;
        this._drawSvg();
    }

    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue || !this._box) return;
        this._parseAttributesToProperties();
        this._drawSvg();
    }

    private _drawSvg() {
        const filled = this.hasAttribute('filled');
        const reverse = this.hasAttribute('reverse');
        // A white shape using difference compositing is the browser equivalent
        // of ZPL's reverse-field knockout: white label pixels become black and
        // black pixels from earlier fields become white.
        this.style.mixBlendMode = reverse ? 'difference' : '';
        const elementWidth = parseInt(this.style.width.replace("px", "")) || this.clientWidth || 1;
        const elementHeight = parseInt(this.style.height.replace("px", "")) || this.clientHeight || 1;
        const x = filled ? 0 : this.strokeWidth / 2;
        let width = filled ? elementWidth : elementWidth - this.strokeWidth;
        if (!filled && width < this.strokeWidth)
            width = this.strokeWidth;
        let height = filled ? elementHeight : elementHeight - this.strokeWidth;
        if (!filled && height < this.strokeWidth)
            height = this.strokeWidth;
        let smallerLength = width;
        if(smallerLength > height)
        smallerLength = height;
        let radius = (1/8) * this.cornerRounding * smallerLength / 2;
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const paint = reverse || this.strokeColor == StrokeColor.white ? 'white' : 'black';
        // Very thin filled ^GB fields (for example 700x3 with thickness 3)
        // can lose their SVG paint when the browser clips the inline SVG line
        // box. Paint the backing div too so horizontal/vertical rules remain
        // visible at their exact ZPL dimensions.
        this._box.style.backgroundColor = filled ? paint : 'transparent';
        rect.setAttribute("stroke", filled ? "none" : paint);
        rect.setAttribute("fill", filled ? paint : "none");
        rect.setAttribute("stroke-width", filled ? "0" : this.strokeWidth.toString());
        rect.setAttribute("x", x.toString());
        rect.setAttribute("y", x.toString());
        rect.setAttribute("rx", radius.toString());
        rect.setAttribute("ry", radius.toString());
        rect.setAttribute("width", width.toString());
        rect.setAttribute("height", height.toString());
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.overflow = "visible";
        if (this._box.childElementCount > 0)
            this._box.removeChild(this._box.children[0]);
        svg.appendChild(rect);
        this._box.appendChild(svg);
    }

    public createZpl() {
        const width = Number(this.style.width.replace("px", ""));
        const height = Number(this.style.height.replace("px", ""));
        const thickness = this.hasAttribute('filled')
            ? Math.max(this.strokeWidth, Math.min(width, height))
            : this.strokeWidth;
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        if (this.hasAttribute('reverse'))
            zpl += "^FR";
        zpl += "^GB"
            + this.style.width.replace("px", "") + ","
            + this.style.height.replace("px", "") + ","
            + thickness + ","
            + (this.strokeColor == StrokeColor.black ? "B" : "W") + ","
            + this.cornerRounding;
        zpl += "^FS";
        return zpl;
    }
}

customElements.define(ZplGraphicBox.is, ZplGraphicBox);
