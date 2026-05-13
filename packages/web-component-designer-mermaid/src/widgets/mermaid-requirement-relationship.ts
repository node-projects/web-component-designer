import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { boundsFromWaypoints, decodeWaypoints, midpointFromWaypoints, pathDataFromWaypoints } from "../services/mermaidGeometry.js";
import { sanitizeId } from "./mermaid-node.js";

export class MermaidRequirementRelationship extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
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
        <path id="path" marker-end="url(#marker)"></path>
        <text id="label"></text>
    </svg>`;

    static readonly is = "mermaid-requirement-relationship";

    public from: string = "source";
    public to: string = "target";
    public relationshipType: string = "satisfies";
    public syntaxDirection: string = "forward";
    public waypoints: string = "";
    private _previewWaypoints: string;

    private _label: SVGTextElement;
    private _path: SVGPathElement;
    private _svg: SVGSVGElement;

    static readonly properties = {
        from: String,
        to: String,
        relationshipType: String,
        syntaxDirection: String,
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
        const bounds = boundsFromWaypoints(waypoints);
        const width = Math.max(24, Math.round(bounds.width + padding * 2));
        const height = Math.max(24, Math.round(bounds.height + padding * 2));
        const offsetX = (width - bounds.width) / 2;
        const offsetY = (height - bounds.height) / 2;

        this.style.left = `${Math.round(bounds.x - offsetX)}px`;
        this.style.top = `${Math.round(bounds.y - offsetY)}px`;
        this.style.width = `${width}px`;
        this.style.height = `${height}px`;

        const shifted = waypoints.map(point => ({ x: point.x - bounds.x + offsetX, y: point.y - bounds.y + offsetY }));
        const middle = midpointFromWaypoints(shifted);
        const relationshipType = this.getAttribute("relationship-type") ?? this.relationshipType;

        this._svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        this._path.setAttribute("d", pathDataFromWaypoints(shifted));
        this._label.textContent = relationshipType;
        this._label.setAttribute("x", middle.x.toString());
        this._label.setAttribute("y", (middle.y - 8).toString());
        this._label.setAttribute("text-anchor", "middle");
    }

    public createMermaid() {
        const from = sanitizeId(this.getAttribute("from") ?? this.from);
        const to = sanitizeId(this.getAttribute("to") ?? this.to);
        const relationshipType = this.getAttribute("relationship-type") ?? this.relationshipType;
        const syntaxDirection = this.getAttribute("syntax-direction") ?? this.syntaxDirection;
        if (syntaxDirection === "reverse")
            return `${to} <- ${relationshipType} - ${from}`;
        return `${from} - ${relationshipType} -> ${to}`;
    }
}

customElements.define(MermaidRequirementRelationship.is, MermaidRequirementRelationship);
