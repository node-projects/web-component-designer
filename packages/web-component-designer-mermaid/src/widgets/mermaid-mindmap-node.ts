import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { formatMermaidLabel, renderMarkdownLabel, sanitizeId } from "./mermaid-node.js";

enum MermaidMindmapNodeShape {
    default = "default",
    square = "square",
    round = "round",
    circle = "circle",
    bang = "bang",
    cloud = "cloud",
    hexagon = "hexagon",
}

export class MermaidMindmapNode extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    * {
        box-sizing: border-box;
    }

    :host {
        display: block;
        overflow: visible;
    }

    #connections {
        height: 100%;
        left: 0;
        overflow: visible;
        pointer-events: none;
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 0;
    }

    #node {
        align-items: center;
        background: white;
        border: 2px solid #333;
        color: #111;
        display: flex;
        font-family: Arial, sans-serif;
        font-size: 14px;
        height: 100%;
        justify-content: center;
        min-height: 34px;
        min-width: 84px;
        overflow: hidden;
        padding: 6px 12px;
        pointer-events: none;
        position: relative;
        text-align: center;
        width: 100%;
        z-index: 1;
    }

    ::slotted(mermaid-mindmap-node) {
        z-index: 1;
    }

    #node[data-shape="circle"] {
        border-radius: 50%;
    }

    #node[data-shape="round"] {
        border-radius: 12px;
    }

    #node[data-shape="bang"] {
        clip-path: polygon(50% 0, 61% 34%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 34%);
        padding: 16px;
    }

    #node[data-shape="cloud"] {
        border-radius: 999px;
        box-shadow: 12px 0 0 -2px white, 13px 0 0 0 #333, -12px 0 0 -2px white, -13px 0 0 0 #333;
    }

    #node[data-shape="hexagon"] {
        clip-path: polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%);
        padding: 8px 22px;
    }
    `;

    static override readonly template = html`<svg id="connections"></svg><div id="node"></div><slot id="children"></slot>`;

    static readonly is = "mermaid-mindmap-node";

    public mindmapId: string = "Root";
    public label: string = "Node";
    public shape: MermaidMindmapNodeShape = MermaidMindmapNodeShape.default;

    private _node: HTMLDivElement;
    private _connections: SVGSVGElement;
    private _slot: HTMLSlotElement;
    private _childObserver = new MutationObserver(() => this._renderConnections());
    private _resizeObserver = new ResizeObserver(() => this._renderConnections());

    static readonly properties = {
        mindmapId: String,
        label: String,
        shape: MermaidMindmapNodeShape,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._node = this._getDomElement<HTMLDivElement>("node");
        this._connections = this._getDomElement<SVGSVGElement>("connections");
        this._slot = this._getDomElement<HTMLSlotElement>("children");
    }

    async ready() {
        this._parseAttributesToProperties();
        this._render();
        this._slot.addEventListener("slotchange", () => this._observeChildren());
        this._resizeObserver.observe(this);
        this._observeChildren();
        requestAnimationFrame(() => this._renderConnections());
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue !== newValue) {
            this._parseAttributesToProperties();
            this._render();
        }
    }

    private _render() {
        const label = this.getAttribute("label") ?? this.label ?? this.getAttribute("mindmap-id") ?? this.mindmapId;
        const shape = this.getAttribute("shape") as MermaidMindmapNodeShape ?? this.shape;
        renderMarkdownLabel(this._node, label);
        this._node.dataset.shape = shape;
        this._renderConnections();
    }

    private _observeChildren() {
        this._childObserver.disconnect();
        this._resizeObserver.disconnect();
        this._resizeObserver.observe(this);
        for (const child of this._getMindmapChildren()) {
            this._childObserver.observe(child, { attributeFilter: ["style"], attributes: true });
            this._resizeObserver.observe(child);
        }
        this._renderConnections();
    }

    private _renderConnections() {
        this._connections.replaceChildren();
        const children = this._getMindmapChildren();
        if (!children.length)
            return;

        const hostWidth = this.offsetWidth;
        const hostHeight = this.offsetHeight;
        const source = { x: hostWidth / 2, y: hostHeight / 2 };
        const strokeWidth = getConnectionStrokeWidth(this);

        for (const child of children) {
            const childLeft = Number.parseFloat(child.style.left || "0");
            const childTop = Number.parseFloat(child.style.top || "0");
            const childWidth = child.offsetWidth || Number.parseFloat(child.style.width || "0");
            const childHeight = child.offsetHeight || Number.parseFloat(child.style.height || "0");
            const target = { x: childLeft + childWidth / 2, y: childTop + childHeight / 2 };
            const direction = target.x >= source.x ? 1 : -1;
            const start = { x: source.x + direction * hostWidth / 2, y: source.y };
            const end = { x: target.x - direction * childWidth / 2, y: target.y };
            const controlDistance = Math.max(24, Math.abs(end.x - start.x) * 0.45);
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${start.x} ${start.y} C ${start.x + direction * controlDistance} ${start.y}, ${end.x - direction * controlDistance} ${end.y}, ${end.x} ${end.y}`);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "#666");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-width", strokeWidth.toString());
            this._connections.appendChild(path);
        }
    }

    private _getMindmapChildren() {
        return this._slot.assignedElements().filter((element): element is MermaidMindmapNode => element.localName === MermaidMindmapNode.is);
    }

    public createMermaid() {
        const id = sanitizeId(this.getAttribute("mindmap-id") ?? this.mindmapId);
        const label = formatMermaidLabel((this.getAttribute("label") ?? this.label) || id);
        const shape = this.getAttribute("shape") as MermaidMindmapNodeShape ?? this.shape;

        switch (shape) {
            case MermaidMindmapNodeShape.square:
                return `${id}[${label}]`;
            case MermaidMindmapNodeShape.round:
                return `${id}(${label})`;
            case MermaidMindmapNodeShape.circle:
                return `${id}((${label}))`;
            case MermaidMindmapNodeShape.bang:
                return `${id}))${label}((`;
            case MermaidMindmapNodeShape.cloud:
                return `${id})${label}(`;
            case MermaidMindmapNodeShape.hexagon:
                return `${id}{{${label}}}`;
            default:
                return label;
        }
    }
}

customElements.define(MermaidMindmapNode.is, MermaidMindmapNode);

function getConnectionStrokeWidth(element: Element) {
    let depth = 0;
    let current = element.parentElement;
    while (current) {
        if (current.localName === MermaidMindmapNode.is)
            depth++;
        current = current.parentElement;
    }
    return Math.max(1.5, 5 - depth * 1.2);
}
