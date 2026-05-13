import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

enum MermaidNodeShape {
    rectangle = "rectangle",
    round = "round",
    stadium = "stadium",
    circle = "circle",
    decision = "decision",
    subroutine = "subroutine",
    cylinder = "cylinder",
    asymmetric = "asymmetric",
    hexagon = "hexagon",
    parallelogram = "parallelogram",
    parallelogramAlt = "parallelogramAlt",
    trapezoid = "trapezoid",
    trapezoidAlt = "trapezoidAlt",
    doubleCircle = "doubleCircle",
    bang = "bang",
    cloud = "cloud",
    hourglass = "hourglass",
    bolt = "bolt",
    brace = "brace",
    braceRight = "brace-r",
    braces = "braces",
    dataStore = "datastore",
    delay = "delay",
    horizontalCylinder = "h-cyl",
    linedCylinder = "lin-cyl",
    curvedTrapezoid = "curv-trap",
    dividedRectangle = "div-rect",
    document = "doc",
    triangle = "tri",
    fork = "fork",
    windowPane = "win-pane",
    filledCircle = "f-circ",
    linedDocument = "lin-doc",
    linedRectangle = "lin-rect",
    notchedPentagon = "notch-pent",
    flippedTriangle = "flip-tri",
    slopedRectangle = "sl-rect",
    stackedDocument = "docs",
    stackedRectangle = "st-rect",
    flag = "flag",
    bowTieRectangle = "bow-rect",
    framedCircle = "fr-circ",
    crossedCircle = "cross-circ",
    taggedDocument = "tag-doc",
    taggedRectangle = "tag-rect",
    text = "text",
    card = "notch-rect",
}

export class MermaidNode extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    * {
        box-sizing: border-box;
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
        min-height: 32px;
        min-width: 64px;
        overflow: hidden;
        white-space: pre-line;
        padding: 6px 10px;
        pointer-events: none;
        text-align: center;
        width: 100%;
    }

    #node[data-shape="decision"] {
        clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
        padding: 10px 22px;
    }

    #node[data-shape="subroutine"] {
        box-shadow: inset 8px 0 0 white, inset 10px 0 0 #333, inset -8px 0 0 white, inset -10px 0 0 #333;
    }

    #node[data-shape="cylinder"] {
        border-radius: 50% / 14%;
    }

    #node[data-shape="asymmetric"] {
        clip-path: polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%);
    }

    #node[data-shape="hexagon"] {
        clip-path: polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%);
    }

    #node[data-shape="parallelogram"] {
        clip-path: polygon(14% 0, 100% 0, 86% 100%, 0 100%);
    }

    #node[data-shape="parallelogramAlt"] {
        clip-path: polygon(0 0, 86% 0, 100% 100%, 14% 100%);
    }

    #node[data-shape="trapezoid"] {
        clip-path: polygon(14% 0, 86% 0, 100% 100%, 0 100%);
    }

    #node[data-shape="trapezoidAlt"] {
        clip-path: polygon(0 0, 100% 0, 86% 100%, 14% 100%);
    }

    #node[data-shape="doubleCircle"] {
        border-radius: 50%;
        box-shadow: inset 0 0 0 4px white, inset 0 0 0 6px #333;
    }

    #node[data-shape="bang"] {
        clip-path: polygon(50% 0, 61% 34%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 34%);
        padding: 14px;
    }

    #node[data-shape="cloud"] {
        border-radius: 999px;
        box-shadow: 12px 0 0 -2px white, 13px 0 0 0 #333, -12px 0 0 -2px white, -13px 0 0 0 #333;
    }

    #node[data-shape="hourglass"] {
        clip-path: polygon(0 0, 100% 0, 62% 50%, 100% 100%, 0 100%, 38% 50%);
    }

    #node[data-shape="bolt"] {
        clip-path: polygon(44% 0, 78% 0, 56% 38%, 82% 38%, 31% 100%, 45% 52%, 20% 52%);
    }

    #node[data-shape="brace"],
    #node[data-shape="brace-r"],
    #node[data-shape="braces"] {
        border-color: transparent;
        font-size: 15px;
    }

    #node[data-shape="brace"]::before,
    #node[data-shape="braces"]::before {
        content: "{";
        font-size: 42px;
        line-height: 1;
        margin-right: 6px;
    }

    #node[data-shape="brace-r"]::after,
    #node[data-shape="braces"]::after {
        content: "}";
        font-size: 42px;
        line-height: 1;
        margin-left: 6px;
    }

    #node[data-shape="datastore"] {
        border-left-color: transparent;
        border-right-color: transparent;
    }

    #node[data-shape="delay"] {
        border-radius: 0 999px 999px 0;
    }

    #node[data-shape="h-cyl"],
    #node[data-shape="lin-cyl"] {
        border-radius: 22% / 50%;
    }

    #node[data-shape="curv-trap"] {
        clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
        border-radius: 45% 8% 45% 8% / 16%;
    }

    #node[data-shape="div-rect"],
    #node[data-shape="lin-rect"],
    #node[data-shape="win-pane"] {
        box-shadow: inset 0 -16px 0 rgba(0, 0, 0, 0.08);
    }

    #node[data-shape="doc"],
    #node[data-shape="lin-doc"],
    #node[data-shape="docs"],
    #node[data-shape="tag-doc"] {
        border-radius: 0 0 16px 16px / 0 0 8px 8px;
    }

    #node[data-shape="tri"] {
        clip-path: polygon(50% 0, 100% 100%, 0 100%);
        padding-top: 20px;
    }

    #node[data-shape="flip-tri"] {
        clip-path: polygon(0 0, 100% 0, 50% 100%);
        padding-bottom: 20px;
    }

    #node[data-shape="fork"] {
        min-height: 16px;
        background: #333;
        color: white;
    }

    #node[data-shape="f-circ"] {
        background: #333;
        border-radius: 50%;
        color: white;
    }

    #node[data-shape="notch-pent"] {
        clip-path: polygon(12% 0, 88% 0, 100% 50%, 88% 100%, 12% 100%, 0 50%);
    }

    #node[data-shape="sl-rect"] {
        clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
    }

    #node[data-shape="flag"] {
        clip-path: polygon(0 0, 100% 0, 86% 50%, 100% 100%, 0 100%);
    }

    #node[data-shape="bow-rect"] {
        clip-path: polygon(0 0, 35% 0, 50% 50%, 65% 0, 100% 0, 100% 100%, 65% 100%, 50% 50%, 35% 100%, 0 100%);
    }

    #node[data-shape="fr-circ"] {
        border-radius: 50%;
        box-shadow: inset 0 0 0 4px white, inset 0 0 0 6px #333;
    }

    #node[data-shape="cross-circ"] {
        border-radius: 50%;
    }

    #node[data-shape="cross-circ"]::before {
        content: "×";
        font-size: 28px;
        margin-right: 4px;
    }

    #node[data-shape="tag-rect"],
    #node[data-shape="tag-doc"],
    #node[data-shape="notch-rect"] {
        clip-path: polygon(10% 0, 100% 0, 100% 100%, 10% 100%, 0 50%);
    }

    #node[data-shape="text"] {
        background: transparent;
        border-color: transparent;
    }
    `;

    static override readonly template = html`<div id="node"></div>`;

    static readonly is = "mermaid-node";

    public nodeId: string = "A";
    public label: string = "Node";
    public shape: MermaidNodeShape = MermaidNodeShape.rectangle;

    private _node: HTMLDivElement;

    static readonly properties = {
        nodeId: String,
        label: String,
        shape: MermaidNodeShape,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._node = this._getDomElement<HTMLDivElement>("node");
    }

    async ready() {
        this._parseAttributesToProperties();
        this._render();
    }

    private _render() {
        const label = this.getAttribute("label") ?? this.label;
        const nodeId = this.getAttribute("node-id") ?? this.nodeId;
        const shape = this.getAttribute("shape") as MermaidNodeShape ?? this.shape;
        renderMarkdownLabel(this._node, label || nodeId);
        this._node.dataset.shape = shape;
        this._node.style.clipPath = "";
        this._node.style.boxShadow = "";
        switch (shape) {
            case MermaidNodeShape.round:
                this._node.style.borderRadius = "12px";
                break;
            case MermaidNodeShape.stadium:
                this._node.style.borderRadius = "999px";
                break;
            case MermaidNodeShape.circle:
            case MermaidNodeShape.doubleCircle:
            case MermaidNodeShape.framedCircle:
            case MermaidNodeShape.crossedCircle:
            case MermaidNodeShape.filledCircle:
                this._node.style.borderRadius = "50%";
                break;
            case MermaidNodeShape.cylinder:
            case MermaidNodeShape.horizontalCylinder:
            case MermaidNodeShape.linedCylinder:
                this._node.style.borderRadius = "50% / 14%";
                break;
            default:
                this._node.style.borderRadius = "0";
                break;
        }
    }

    public createMermaid() {
        const id = sanitizeId(this.getAttribute("node-id") ?? this.nodeId);
        const label = formatMermaidLabel((this.getAttribute("label") ?? this.label) || id);
        const shape = this.getAttribute("shape") as MermaidNodeShape ?? this.shape;

        switch (shape) {
            case MermaidNodeShape.round:
                return `${id}(${label})`;
            case MermaidNodeShape.stadium:
                return `${id}([${label}])`;
            case MermaidNodeShape.circle:
                return `${id}((${label}))`;
            case MermaidNodeShape.decision:
                return `${id}{${label}}`;
            case MermaidNodeShape.subroutine:
                return `${id}[[${label}]]`;
            case MermaidNodeShape.cylinder:
                return `${id}[(${label})]`;
            case MermaidNodeShape.asymmetric:
                return `${id}>${label}]`;
            case MermaidNodeShape.hexagon:
                return `${id}{{${label}}}`;
            case MermaidNodeShape.parallelogram:
                return `${id}[/${label}/]`;
            case MermaidNodeShape.parallelogramAlt:
                return `${id}[\\${label}\\]`;
            case MermaidNodeShape.trapezoid:
                return `${id}[/${label}\\]`;
            case MermaidNodeShape.trapezoidAlt:
                return `${id}[\\${label}/]`;
            case MermaidNodeShape.doubleCircle:
                return `${id}(((${label})))`;
            default:
                if (isExpandedShape(shape))
                    return `${id}@{ shape: ${shape}, label: ${label} }`;
                return `${id}[${label}]`;
        }
    }
}

function isExpandedShape(shape: string) {
    return !!shape && shape !== MermaidNodeShape.rectangle;
}

export function sanitizeId(id: string) {
    return (id || "A").replace(/[^a-zA-Z0-9_]/g, "_");
}

export function escapeLabel(label: string) {
    return (label || "").replaceAll("\"", "#quot;");
}

export function formatMermaidLabel(label: string) {
    const escaped = escapeLabel(label);
    if (shouldWriteMarkdownLabel(escaped))
        return "\"`" + escaped + "`\"";
    return escaped.includes("`") ? `"${escaped}"` : escaped;
}

export function stripMarkdownLabel(label: string) {
    return normalizeLabelLineBreaks((label || "").replace(/^`|`$/g, ""));
}

export function renderMarkdownLabel(container: HTMLElement | SVGTextElement, label: string) {
    container.replaceChildren();
    const normalizedLabel = stripMarkdownLabel(label);
    const lines = splitMarkdownLines(normalizedLabel);
    for (let i = 0; i < lines.length; i++) {
        if (i > 0)
            container.appendChild(document.createElement("br"));
        renderInlineMarkdown(container, lines[i]);
    }
}

function renderInlineMarkdown(container: Element, text: string) {
    let position = 0;
    while (position < text.length) {
        const nextDelimiter = findNextMarkdownDelimiter(text, position);
        if (!nextDelimiter) {
            appendText(container, text.substring(position));
            return;
        }

        if (nextDelimiter.index > position)
            appendText(container, text.substring(position, nextDelimiter.index));

        const end = text.indexOf(nextDelimiter.token, nextDelimiter.index + nextDelimiter.token.length);
        if (end < 0) {
            appendText(container, text.substring(nextDelimiter.index, nextDelimiter.index + nextDelimiter.token.length));
            position = nextDelimiter.index + nextDelimiter.token.length;
            continue;
        }

        const element = document.createElement(nextDelimiter.token.length === 2 ? "strong" : "em");
        renderInlineMarkdown(element, text.substring(nextDelimiter.index + nextDelimiter.token.length, end));
        container.appendChild(element);
        position = end + nextDelimiter.token.length;
    }
}

function findNextMarkdownDelimiter(text: string, start: number) {
    const tokens = ["**", "__", "*", "_"];
    let result: { token: string; index: number } = null;
    for (const token of tokens) {
        const index = text.indexOf(token, start);
        if (index >= 0 && (!result || index < result.index || (index === result.index && token.length > result.token.length)))
            result = { token, index };
    }
    return result;
}

function appendText(container: Element, text: string) {
    if (text)
        container.appendChild(document.createTextNode(text));
}

function splitMarkdownLines(text: string) {
    const lines: string[] = [];
    let start = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") {
            lines.push(text.substring(start, i));
            start = i + 1;
        }
    }
    lines.push(text.substring(start));
    return lines;
}

function shouldWriteMarkdownLabel(label: string) {
    return label.includes("\n") || label.includes("**") || label.includes("_") || label.includes("*");
}

export function normalizeLabelLineBreaks(label: string) {
    return label.replaceAll("<br>", "\n").replaceAll("<br/>", "\n").replaceAll("<br />", "\n");
}

customElements.define(MermaidNode.is, MermaidNode);
