import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { escapeLabel, sanitizeId } from "./mermaid-node.js";

export class MermaidSubgraph extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    :host {
        background: rgba(245, 245, 245, 0.55);
        border: 2px dashed #777;
        color: #222;
        display: block;
        font-family: Arial, sans-serif;
        font-size: 13px;
        overflow: visible;
        padding-top: 28px;
    }

    #title {
        background: rgba(255, 255, 255, 0.85);
        border-bottom: 1px solid #aaa;
        font-weight: 600;
        left: 0;
        overflow: hidden;
        padding: 5px 8px;
        pointer-events: none;
        position: absolute;
        right: 0;
        text-overflow: ellipsis;
        top: 0;
        white-space: nowrap;
    }
    `;

    static override readonly template = html`<div id="title"></div><slot></slot>`;

    static readonly is = "mermaid-subgraph";

    public subgraphId: string = "";
    public override title: string = "Subgraph";
    public direction: string = "";

    private _titleElement: HTMLDivElement;

    static readonly properties = {
        subgraphId: String,
        title: String,
        direction: String,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._titleElement = this._getDomElement<HTMLDivElement>("title");
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
        this._titleElement.textContent = this.getAttribute("title") ?? this.title;
    }

    public createMermaidStart() {
        const id = this.getAttribute("subgraph-id") ?? this.subgraphId;
        const title = this.getAttribute("title") ?? this.title;
        if (id && title && id !== title)
            return `subgraph ${sanitizeId(id)}[${escapeLabel(title)}]`;
        return `subgraph ${escapeLabel(title || id || "Subgraph")}`;
    }
}

customElements.define(MermaidSubgraph.is, MermaidSubgraph);
