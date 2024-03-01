import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { getZplCoordinates } from "../zplHelper.js";

enum StrokeColor {
    black = "black",
    white = "white",
}
enum Orientation {
    L = "L",
    R = "R",
}

export class ZplGraphicDiagonalLine extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css` *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="box-div" style="width: 100%; height: 100%;">
    </div>
    `;

    static readonly is = 'zpl-graphic-diagonal-line';

    public strokeWidth: number = 1;
    public strokeColor: string = "black";
    public orientation: string;

    private _line: HTMLDivElement;
    private _observer: ResizeObserver;

    static readonly properties = {
        strokeWidth: Number,
        strokeColor: StrokeColor,
        orientation: Orientation,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._line = this._getDomElement<HTMLDivElement>("box-div");
        this._observer = new ResizeObserver(() => this._drawSvg());
        this._observer.observe(this);
    }

    async ready() {
        this._parseAttributesToProperties();
        this._drawSvg();
    }

    private _drawSvg() {
        let w = parseInt(this.style.width.replace("px", ""));
        let h = parseInt(this.style.height.replace("px", "")) - this.strokeWidth;
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        if (this.strokeColor == StrokeColor.black)
            line.setAttribute("stroke", "black");
        else
            line.setAttribute("stroke", "white");
        line.setAttribute("fill", "white");
        line.setAttribute("fill-opacity", "0.0");
        line.setAttribute("stroke-width", this.strokeWidth.toString());
        if (this.orientation == Orientation.L) {
            line.setAttribute("x1", "0");
            line.setAttribute("y1", "0");
            line.setAttribute("x2", w.toString());
            line.setAttribute("y2", h.toString());
        }
        else {
            line.setAttribute("x1", "0");
            line.setAttribute("y1", h.toString());
            line.setAttribute("x2", w.toString());
            line.setAttribute("y2", "0");
        }
        svg.style.overflow = "visible";
        if (this._line.childElementCount > 0)
            this._line.removeChild(this._line.children[0]);
        svg.appendChild(line);
        this._line.appendChild(svg);
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        zpl += "^GD"
            + this.style.width.replace("px", "") + ","
            + this.style.height.replace("px", "") + ","
            + this.strokeWidth + ","
            + (this.strokeColor == StrokeColor.black ? "B" : "W") + ","
            + this.orientation;
        zpl += "^FS";
        return zpl;
    }
}

customElements.define(ZplGraphicDiagonalLine.is, ZplGraphicDiagonalLine);
