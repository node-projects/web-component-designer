import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { escapeLabel, sanitizeId } from "./mermaid-node.js";

enum MermaidSequenceMessageType {
    solid = "solid",
    dotted = "dotted",
    open = "open",
    cross = "cross",
    async = "async",
}

export class MermaidSequenceMessage extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    * {
        box-sizing: border-box;
    }

    :host {
        display: block;
        overflow: visible;
        pointer-events: auto;
        position: absolute;
        z-index: 4;
    }

    svg {
        height: 100%;
        overflow: visible;
        width: 100%;
    }

    path {
        fill: none;
        stroke: #333;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
    }

    #marker-shape {
        fill: #333;
    }

    text {
        fill: #333;
        font-family: Arial, sans-serif;
        font-size: 12px;
        pointer-events: none;
    }
    `;

    static override readonly template = html`
    <svg id="svg" viewBox="0 0 10 10" preserveAspectRatio="none">
        <defs>
            <marker id="marker" viewBox="0 0 12 12" markerWidth="10" markerHeight="10" refX="10.5" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                <path id="marker-shape" d="M 1 1 L 10.5 6 L 1 11 z"></path>
            </marker>
        </defs>
        <path id="path"></path>
        <text id="label"></text>
    </svg>`;

    static readonly is = "mermaid-sequence-message";

    public from: string = "Alice";
    public to: string = "Bob";
    public label: string = "Message";
    public messageType: MermaidSequenceMessageType = MermaidSequenceMessageType.solid;
    public connector: string = "->>";

    private _label: SVGTextElement;
    private _path: SVGPathElement;
    private _svg: SVGSVGElement;

    static readonly properties = {
        from: String,
        to: String,
        label: String,
        messageType: MermaidSequenceMessageType,
        connector: String,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._label = this._getDomElement<SVGTextElement>("label");
        this._path = this._getDomElement<SVGPathElement>("path");
        this._svg = this._getDomElement<SVGSVGElement>("svg");
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
        const width = Math.max(1, parseFloat(this.style.width || "220"));
        const height = Math.max(28, parseFloat(this.style.height || "36"));
        const y = height / 2;
        const messageType = this.getAttribute("message-type") as MermaidSequenceMessageType ?? this.messageType;
        const label = this.getAttribute("label") ?? this.label ?? "";

        this._svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        this._path.setAttribute("d", `M 0 ${y} L ${width} ${y}`);
        this._path.setAttribute("marker-end", messageType === MermaidSequenceMessageType.open ? "" : "url(#marker)");
        this._path.style.strokeDasharray = messageType === MermaidSequenceMessageType.dotted ? "4 4" : "";
        this._label.textContent = label;
        this._label.setAttribute("x", (width / 2).toString());
        this._label.setAttribute("y", (y - 8).toString());
        this._label.setAttribute("text-anchor", "middle");
    }

    public createMermaid() {
        const from = sanitizeId(this.getAttribute("from") ?? this.from);
        const to = sanitizeId(this.getAttribute("to") ?? this.to);
        const label = this.getAttribute("label") ?? this.label ?? "";
        const connector = this.getAttribute("connector") ?? getConnector(this.getAttribute("message-type") as MermaidSequenceMessageType ?? this.messageType);
        return `${from}${connector}${to}: ${escapeLabel(label)}`;
    }
}

function getConnector(messageType: MermaidSequenceMessageType) {
    switch (messageType) {
        case MermaidSequenceMessageType.dotted:
            return "-->>";
        case MermaidSequenceMessageType.open:
            return "->";
        case MermaidSequenceMessageType.cross:
            return "-x";
        case MermaidSequenceMessageType.async:
            return "-)";
        default:
            return "->>";
    }
}

customElements.define(MermaidSequenceMessage.is, MermaidSequenceMessage);
