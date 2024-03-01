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

    public strokeWidth: number = 1;
    public strokeColor: string = 'black';
    public cornerRounding: number;

    private _box: HTMLDivElement;
    private _observer: ResizeObserver;

    static readonly properties = {
        strokeWidth: Number,
        strokeColor: StrokeColor,
        cornerRounding: Number,
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

    private _drawSvg() {
        let x = this.strokeWidth / 2;
        let width = parseInt(this.style.width.replace("px", "")) - this.strokeWidth;
        if (width < this.strokeWidth)
            width = this.strokeWidth;
        let height = parseInt(this.style.height.replace("px", "")) - this.strokeWidth;
        if (height < this.strokeWidth)
            height = this.strokeWidth;
        let smallerLength = width;
        if(smallerLength > height)
        smallerLength = height;
        let radius = (1/8) * this.cornerRounding * smallerLength / 2;
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        if (this.strokeColor == StrokeColor.black)
            rect.setAttribute("stroke", "black");
        else
            rect.setAttribute("stroke", "white");
        rect.setAttribute("fill", "white");
        rect.setAttribute("fill-opacity", "0.0");
        rect.setAttribute("stroke-width", this.strokeWidth.toString());
        rect.setAttribute("x", x.toString());
        rect.setAttribute("y", x.toString());
        rect.setAttribute("rx", radius.toString());
        rect.setAttribute("ry", radius.toString());
        rect.setAttribute("width", width.toString());
        rect.setAttribute("height", height.toString());
        svg.style.overflow = "visible";
        if (this._box.childElementCount > 0)
            this._box.removeChild(this._box.children[0]);
        svg.appendChild(rect);
        this._box.appendChild(svg);
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        zpl += "^GB"
            + this.style.width.replace("px", "") + ","
            + this.style.height.replace("px", "") + ","
            + this.strokeWidth + ","
            + (this.strokeColor == StrokeColor.black ? "B" : "W") + ","
            + this.cornerRounding;
        zpl += "^FS";
        return zpl;
    }
}

customElements.define(ZplGraphicBox.is, ZplGraphicBox);
