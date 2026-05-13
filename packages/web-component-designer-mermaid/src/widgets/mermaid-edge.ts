import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { boundsFromWaypoints, decodeWaypoints, midpointFromWaypoints, pathDataFromWaypoints } from "../services/mermaidGeometry.js";
import { escapeLabel, sanitizeId } from "./mermaid-node.js";

enum MermaidEdgeType {
    arrow = "arrow",
    open = "open",
    dotted = "dotted",
    thick = "thick",
    invisible = "invisible",
    circle = "circle",
    cross = "cross",
    multi = "multi",
}

export class MermaidEdge extends BaseCustomWebComponentConstructorAppend {
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
        stroke-width: 2.5;
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
            <marker id="marker-start" viewBox="0 0 12 12" markerWidth="10" markerHeight="10" refX="1.5" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                <path id="marker-start-shape" d="M 11 1 L 1.5 6 L 11 11 z"></path>
            </marker>
            <marker id="circle-marker" viewBox="0 0 12 12" markerWidth="10" markerHeight="10" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="4" fill="white" stroke="#333" stroke-width="2"></circle>
            </marker>
            <marker id="cross-marker" viewBox="0 0 12 12" markerWidth="10" markerHeight="10" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 3 3 L 9 9 M 9 3 L 3 9" fill="none" stroke="#333" stroke-width="2"></path>
            </marker>
        </defs>
        <path id="path"></path>
        <text id="label"></text>
    </svg>`;

    static readonly is = "mermaid-edge";

    public from: string = "A";
    public to: string = "B";
    public label: string = "";
    public edgeType: MermaidEdgeType = MermaidEdgeType.arrow;
    public connector: string = "-->";
    public edgeId: string = "";
    public animation: string = "";
    public waypoints: string = "";
    private _previewWaypoints: string;

    private _label: SVGTextElement;
    private _path: SVGPathElement;
    private _svg: SVGSVGElement;

    static readonly properties = {
        from: String,
        to: String,
        label: String,
        edgeType: MermaidEdgeType,
        connector: String,
        edgeId: String,
        animation: String,
        waypoints: String,
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

    public setPreviewWaypoints(waypoints: string | null) {
        this._previewWaypoints = waypoints;
        this._render();
    }

    private _render() {
        let waypoints = decodeWaypoints(this._previewWaypoints ?? this.getAttribute("waypoints") ?? this.waypoints);
        if (waypoints.length < 2)
            waypoints = [{ x: 0, y: 12 }, { x: 180, y: 12 }];

        const padding = 16;
        const minCrossAxisSize = 24;
        const bounds = boundsFromWaypoints(waypoints);
        const width = Math.max(minCrossAxisSize, Math.round(bounds.width + padding * 2));
        const height = Math.max(minCrossAxisSize, Math.round(bounds.height + padding * 2));
        const offsetX = (width - bounds.width) / 2;
        const offsetY = (height - bounds.height) / 2;

        this.style.left = `${Math.round(bounds.x - offsetX)}px`;
        this.style.top = `${Math.round(bounds.y - offsetY)}px`;
        this.style.width = `${width}px`;
        this.style.height = `${height}px`;

        const shifted = waypoints.map(point => ({ x: point.x - bounds.x + offsetX, y: point.y - bounds.y + offsetY }));
        const middle = midpointFromWaypoints(shifted);

        this._svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        this._path.setAttribute("d", pathDataFromWaypoints(shifted));
        const edgeType = this.getAttribute("edge-type") as MermaidEdgeType ?? this.edgeType;
        const connector = this.getAttribute("connector") ?? this.connector;
        const label = this.getAttribute("label") ?? this.label ?? "";
        this._path.setAttribute("marker-start", connector.startsWith("<") || edgeType === MermaidEdgeType.multi ? "url(#marker-start)" : "");
        this._path.setAttribute("marker-end", getMarkerEnd(edgeType, connector));
        this._path.style.strokeDasharray = edgeType === MermaidEdgeType.dotted ? "4 4" : "";
        this._path.style.strokeWidth = edgeType === MermaidEdgeType.thick ? "4" : "2.5";
        this._path.style.opacity = edgeType === MermaidEdgeType.invisible ? "0" : "";
        this._label.textContent = label;
        this._label.style.display = label ? "block" : "none";
        this._label.setAttribute("x", middle.x.toString());
        this._label.setAttribute("y", (middle.y - 8).toString());
        this._label.setAttribute("text-anchor", "middle");
    }

    public createMermaid() {
        const from = sanitizeId(this.getAttribute("from") ?? this.from);
        const to = sanitizeId(this.getAttribute("to") ?? this.to);
        const label = this.getAttribute("label") ?? this.label;
        const explicitConnector = this.getAttribute("connector") ?? this.connector;
        const connector = explicitConnector ? { plain: explicitConnector, label: explicitConnector } : getConnector(this.getAttribute("edge-type") as MermaidEdgeType ?? this.edgeType);
        const rawEdgeId = this.getAttribute("edge-id") ?? this.edgeId;
        const edgeId = rawEdgeId ? sanitizeId(rawEdgeId) : "";
        const prefix = edgeId ? edgeId + "@" : "";

        if (label)
            return `${from} ${prefix}${connector.label}|${escapeLabel(label)}| ${to}`;

        return `${from} ${prefix}${connector.plain} ${to}`;
    }
}

function getMarkerEnd(edgeType: MermaidEdgeType, connector: string) {
    if (edgeType === MermaidEdgeType.open || edgeType === MermaidEdgeType.invisible || connector.endsWith("---") || connector.endsWith("===") || connector.endsWith("-.-"))
        return "";
    if (edgeType === MermaidEdgeType.circle || connector.includes("o"))
        return "url(#circle-marker)";
    if (edgeType === MermaidEdgeType.cross || connector.includes("x"))
        return "url(#cross-marker)";
    return "url(#marker)";
}

function getConnector(edgeType: MermaidEdgeType) {
    switch (edgeType) {
        case MermaidEdgeType.open:
            return { plain: "---", label: "---" };
        case MermaidEdgeType.dotted:
            return { plain: "-.->", label: "-.->" };
        case MermaidEdgeType.thick:
            return { plain: "==>", label: "==>" };
        case MermaidEdgeType.invisible:
            return { plain: "~~~", label: "~~~" };
        case MermaidEdgeType.circle:
            return { plain: "--o", label: "--o" };
        case MermaidEdgeType.cross:
            return { plain: "--x", label: "--x" };
        case MermaidEdgeType.multi:
            return { plain: "<-->", label: "<-->" };
        default:
            return { plain: "-->", label: "-->" };
    }
}

customElements.define(MermaidEdge.is, MermaidEdge);
