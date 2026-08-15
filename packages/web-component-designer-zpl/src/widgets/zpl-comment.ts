import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export class ZplComment extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css`
    :host {
        display: none;
    }`;

    static override readonly template = html``;

    static readonly is = 'zpl-comment';
    static get observedAttributes() { return ['content']; }

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

    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue !== newValue) this._parseAttributesToProperties();
    }

    public createZpl() {
        return "^FX" + this.content + "^FS";
    }
}

customElements.define(ZplComment.is, ZplComment);
