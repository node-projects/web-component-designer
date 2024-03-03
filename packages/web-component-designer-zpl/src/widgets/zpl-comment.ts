import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export class ZplComment extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css`
    :host {
        display: none;
    }`;

    static override readonly template = html``;

    static readonly is = 'zpl-comment';

    public content: string;

    static readonly properties = {
        content: String
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    async ready() {
        this._parseAttributesToProperties();
    }

    public createZpl() {
        let zpl = "";
        zpl += "^FX" + this.content
        return zpl;
    }
}

customElements.define(ZplComment.is, ZplComment);