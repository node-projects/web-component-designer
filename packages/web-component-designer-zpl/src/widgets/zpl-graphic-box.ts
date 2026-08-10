import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { getZplCoordinates } from "../zplHelper.js";
import { clampGraphicSize } from "../zplFontMetrics.js";

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
        const thickness = this.strokeWidth > 0 ? this.strokeWidth : 1;
        // ZPL clamps the box up to at least the border thickness (^GB10,10,20
        // prints 20x20), then draws the border inward, so the painted extent is
        // exactly the outer size. Clamp the outer box, not the inner rect.
        const outerWidth = clampGraphicSize(parseInt(this.style.width.replace("px", "")), thickness);
        const outerHeight = clampGraphicSize(parseInt(this.style.height.replace("px", "")), thickness);

        // Size the inner box to the printed extent, not the host element: ^GB0,100,2
        // is a vertical line, and box-div's "100%" would otherwise clip it away
        // entirely. Deliberately never write outerWidth/outerHeight back onto
        // this.style: that field is what createZpl() re-serializes and what the
        // designer's resize handling reads, so mutating it would corrupt a plain
        // load/save round-trip and race with a live drag-resize.
        this._box.style.width = outerWidth + "px";
        this._box.style.height = outerHeight + "px";

        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        if (this.strokeColor == StrokeColor.black)
            rect.setAttribute("stroke", "black");
        else
            rect.setAttribute("stroke", "white");

        // Once the borders meet in either axis the shape is solid, which is how a
        // line (^GB0,h,t) is expressed in ZPL. Draw it filled: a stroked rect with
        // a zero inner width is not rendered at all.
        if (outerWidth <= 2 * thickness || outerHeight <= 2 * thickness) {
            let smallerLength = outerWidth;
            if (smallerLength > outerHeight)
                smallerLength = outerHeight;
            let radius = (1 / 8) * this.cornerRounding * smallerLength / 2;
            rect.setAttribute("fill", this.strokeColor == StrokeColor.black ? "black" : "white");
            rect.setAttribute("x", "0");
            rect.setAttribute("y", "0");
            rect.setAttribute("rx", radius.toString());
            rect.setAttribute("ry", radius.toString());
            rect.setAttribute("width", outerWidth.toString());
            rect.setAttribute("height", outerHeight.toString());
        } else {
            let x = thickness / 2;
            let width = outerWidth - thickness;
            let height = outerHeight - thickness;
            let smallerLength = width;
            if (smallerLength > height)
                smallerLength = height;
            let radius = (1 / 8) * this.cornerRounding * smallerLength / 2;
            rect.setAttribute("fill", "white");
            rect.setAttribute("fill-opacity", "0.0");
            rect.setAttribute("stroke-width", thickness.toString());
            rect.setAttribute("x", x.toString());
            rect.setAttribute("y", x.toString());
            rect.setAttribute("rx", radius.toString());
            rect.setAttribute("ry", radius.toString());
            rect.setAttribute("width", width.toString());
            rect.setAttribute("height", height.toString());
        }
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
