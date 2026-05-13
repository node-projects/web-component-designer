import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export class MermaidFlowchartDirective extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    :host {
        background: #fffbe6;
        border: 1px solid #d6b656;
        color: #6b5600;
        display: block;
        font-family: Arial, sans-serif;
        font-size: 11px;
        overflow: hidden;
        padding: 4px 6px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    `;

    static override readonly template = html`<span id="text"></span>`;

    static readonly is = "mermaid-flowchart-directive";

    public line: string = "";

    private _text: HTMLSpanElement;

    static readonly properties = {
        line: String,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._text = this._getDomElement<HTMLSpanElement>("text");
    }

    async ready() {
        this._parseAttributesToProperties();
        this._render();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue !== newValue) {
            this._parseAttributesToProperties();
            this._render();
        }
    }

    private _render() {
        this._text.textContent = this.getAttribute("line") ?? this.line;
    }

    public createMermaid() {
        return this.getAttribute("line") ?? this.line;
    }
}

customElements.define(MermaidFlowchartDirective.is, MermaidFlowchartDirective);
