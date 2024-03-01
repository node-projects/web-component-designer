import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { getZplCoordinates } from "../zplHelper.js";

enum StrokeColor {
    black = "black",
    white = "white",
}

export class ZplGraphicCircle extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css` *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="circle-div" style="width: 100%; height: 100%;">
    </div>
    `;

    static readonly is = 'zpl-graphic-circle';

    public strokeWidth: number = 1;
    public strokeColor: string = 'black';

    private _circle: HTMLDivElement;
    private _observer: ResizeObserver;

    static readonly properties = {
        strokeWidth: Number,
        strokeColor: StrokeColor,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._circle = this._getDomElement<HTMLDivElement>("circle-div");
        this._observer = new ResizeObserver(() => this._drawSvg());
        this._observer.observe(this);
    }

    async ready() {
        this._parseAttributesToProperties();
        this._drawSvg();
    }

    private _drawSvg() {
        let w = parseInt(this.style.width.replace("px", ""));
        let h = parseInt(this.style.height.replace("px", ""));

        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let circle = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        if (this.strokeColor == StrokeColor.black)
            circle.setAttribute("stroke", "black");
        else
            circle.setAttribute("stroke", "white");
        circle.setAttribute("fill", "white");
        circle.setAttribute("fill-opacity", "0.0");
        circle.setAttribute("stroke-width", this.strokeWidth.toString());
        circle.setAttribute("cx", (w / 2).toString());
        circle.setAttribute("cy", (h / 2).toString());
        circle.setAttribute("rx", ((w / 2) - this.strokeWidth / 2).toString());
        circle.setAttribute("ry", ((h / 2) - this.strokeWidth / 2).toString());
        if (this._circle.childElementCount > 0)
            this._circle.removeChild(this._circle.children[0]);
        svg.appendChild(circle);
        svg.style.overflow = "visible";
        this._circle.appendChild(svg);
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        zpl += "^GE"
            + this.style.width.replace("px", "") + ","
            + this.style.height.replace("px", "") + ","
            + this.strokeWidth + ","
            + (this.strokeColor == StrokeColor.black ? "B" : "W")
        zpl += "^FS";
        return zpl;
    }
}

customElements.define(ZplGraphicCircle.is, ZplGraphicCircle);
