import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { escapeLabel, renderMarkdownLabel, sanitizeId } from "./mermaid-node.js";

type RequirementNodeKind = "requirement" | "element";

export class MermaidRequirementNode extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    * {
        box-sizing: border-box;
    }

    :host {
        background: #fff;
        border: 2px solid #333;
        color: #111;
        display: block;
        font-family: Arial, sans-serif;
        font-size: 12px;
        overflow: hidden;
    }

    #header {
        border-bottom: 1px solid #666;
        padding: 6px 8px;
        text-align: center;
    }

    #stereotype {
        display: block;
        font-size: 11px;
        line-height: 1.25;
        margin-bottom: 2px;
    }

    #name {
        font-weight: 600;
        line-height: 1.25;
    }

    #body {
        display: grid;
        gap: 4px;
        padding: 8px;
    }

    .row {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px;
        min-width: 0;
    }

    .label {
        color: #555;
        font-weight: 600;
        white-space: nowrap;
    }

    .value {
        min-width: 0;
        overflow-wrap: anywhere;
        white-space: pre-line;
    }
    `;

    static override readonly template = html`
    <div id="header">
        <span id="stereotype"></span>
        <div id="name"></div>
    </div>
    <div id="body"></div>`;

    static readonly is = "mermaid-requirement-node";

    public nodeKind: RequirementNodeKind = "requirement";
    public requirementType: string = "requirement";
    public requirementId: string = "Req";
    public label: string = "Req";
    public text: string = "";
    public risk: string = "low";
    public verifyMethod: string = "test";
    public elementType: string = "";
    public docRef: string = "";

    private _body: HTMLDivElement;
    private _name: HTMLDivElement;
    private _stereotype: HTMLSpanElement;

    static readonly properties = {
        nodeKind: String,
        requirementType: String,
        requirementId: String,
        label: String,
        text: String,
        risk: String,
        verifyMethod: String,
        elementType: String,
        docRef: String,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._body = this._getDomElement<HTMLDivElement>("body");
        this._name = this._getDomElement<HTMLDivElement>("name");
        this._stereotype = this._getDomElement<HTMLSpanElement>("stereotype");
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
        const kind = this.getAttribute("node-kind") as RequirementNodeKind ?? this.nodeKind;
        const name = this.getAttribute("label") ?? this.label;
        this._stereotype.textContent = kind === "element" ? "<<Element>>" : "<<" + getRequirementTypeLabel(this.getAttribute("requirement-type") ?? this.requirementType) + ">>";
        renderMarkdownLabel(this._name, name);
        this._body.replaceChildren();

        if (kind === "element") {
            this._appendRow("Type", this.getAttribute("element-type") ?? this.elementType);
            this._appendRow("DocRef", this.getAttribute("doc-ref") ?? this.docRef);
        } else {
            this._appendRow("Id", this.getAttribute("requirement-id") ?? this.requirementId);
            this._appendRow("Text", this.getAttribute("text") ?? this.text);
            this._appendRow("Risk", this.getAttribute("risk") ?? this.risk);
            this._appendRow("Verification", this.getAttribute("verify-method") ?? this.verifyMethod);
        }
    }

    private _appendRow(label: string, value: string) {
        if (!value)
            return;

        const row = document.createElement("div");
        row.className = "row";
        const labelElement = document.createElement("span");
        labelElement.className = "label";
        labelElement.textContent = label + ":";
        const valueElement = document.createElement("span");
        valueElement.className = "value";
        renderMarkdownLabel(valueElement, value);
        row.append(labelElement, valueElement);
        this._body.appendChild(row);
    }

    public createMermaid() {
        const kind = this.getAttribute("node-kind") as RequirementNodeKind ?? this.nodeKind;
        const name = sanitizeId(this.getAttribute("label") ?? this.label);
        if (kind === "element") {
            const lines = [`element ${name} {`];
            const type = this.getAttribute("element-type") ?? this.elementType;
            const docRef = this.getAttribute("doc-ref") ?? this.docRef;
            if (type)
                lines.push("type: " + formatRequirementValue(type));
            if (docRef)
                lines.push("docRef: " + formatRequirementValue(docRef));
            lines.push("}");
            return lines.join("\n");
        }

        const requirementType = this.getAttribute("requirement-type") ?? this.requirementType;
        const lines = [`${requirementType} ${name} {`];
        lines.push("id: " + formatRequirementValue(this.getAttribute("requirement-id") ?? this.requirementId));
        lines.push("text: " + formatRequirementValue(this.getAttribute("text") ?? this.text));
        lines.push("risk: " + formatRequirementValue(this.getAttribute("risk") ?? this.risk));
        lines.push("verifymethod: " + formatRequirementValue(this.getAttribute("verify-method") ?? this.verifyMethod));
        lines.push("}");
        return lines.join("\n");
    }
}

customElements.define(MermaidRequirementNode.is, MermaidRequirementNode);

function getRequirementTypeLabel(type: string) {
    switch (type) {
        case "functionalRequirement":
            return "Functional Requirement";
        case "interfaceRequirement":
            return "Interface Requirement";
        case "performanceRequirement":
            return "Performance Requirement";
        case "physicalRequirement":
            return "Physical Requirement";
        case "designConstraint":
            return "Design Constraint";
        default:
            return "Requirement";
    }
}

function formatRequirementValue(value: string) {
    return escapeLabel(value ?? "");
}
