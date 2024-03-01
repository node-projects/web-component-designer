import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { getZplCoordinates } from "../zplHelper.js";

enum FontNames {
    Font_0 = "0",
    Font_A = "A",
}

export class ZplText extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css`
    *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="text-div" style="width: 100%; height: 100%; pointer-events: none">
    </div>
    `;

    static readonly is = 'zpl-text';

    public content: string;
    public fontName: string;
    public fontHeight: number;
    public fontWidth: number;

    private _text: HTMLDivElement;

    static readonly properties = {
        content: String,
        fontName: FontNames,
        fontHeight: Number,
        fontWidth: Number
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._text = this._getDomElement<HTMLDivElement>("text-div");
    }

    async ready() {
        this._parseAttributesToProperties();
        this._text.innerHTML = this.content;
        this._text.style.transformOrigin = "0 0";
        switch (this.fontName) {
            case FontNames.Font_0:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "RobotoCn, Verdana";
                this._text.style.fontKerning = "none";
                this._text.style.transform = "scaleX(" + this.fontWidth / 9 + ") scaleY(" + this.fontHeight / 9 + ") translate(0px, -3px)";
                break;
            case FontNames.Font_A:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "monospace";
                this._text.style.transform = "scaleX(" + this.fontWidth / 5 + ") scaleY(" + this.fontHeight / 8 + ") translate(0px, -3px)";
                break;
        }
        this.style.width = '';
        this.style.height = '';
        requestAnimationFrame(() => {
            let rect = this._text.getBoundingClientRect()
            this.style.width = rect.width + 'px';
            this.style.height = rect.height / 2 + 'px';
        });
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        zpl += "^CF" + this.fontName + "," + this.fontHeight + "," + this.fontWidth;
        zpl += "^FD" + this.content
        zpl += "^FS";
        return zpl;
    }
}

customElements.define(ZplText.is, ZplText);