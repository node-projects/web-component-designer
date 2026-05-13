import { AbstractPropertiesService, BindingTarget, IDesignItem, IProperty, PropertyType, RefreshMode, ValueType } from "@node-projects/web-component-designer";
import { rerouteConnectedMermaidEdges } from "./MermaidConnectionRouting.js";
import { FlowchartDirection } from "./mermaidGeometry.js";

export const mermaidDiagramTypeAttribute = "data-mermaid-diagram-type";
export const mermaidFlowchartDirectionAttribute = "data-mermaid-flowchart-direction";
export const mermaidTitleAttribute = "data-mermaid-title";
export const mermaidFrontmatterAttribute = "data-mermaid-frontmatter";

export type MermaidDocumentDiagramType = "flowchart" | "sequenceDiagram" | "mindmap" | "requirementDiagram";

export class MermaidDocumentPropertiesService extends AbstractPropertiesService {
    private readonly _diagramTypeProperty: IProperty = {
        name: "diagramType",
        displayName: "diagram type",
        type: "list",
        values: ["flowchart", "sequenceDiagram", "mindmap", "requirementDiagram"],
        attributeName: mermaidDiagramTypeAttribute,
        service: this,
        propertyType: PropertyType.attribute,
    };

    private readonly _flowchartDirectionProperty: IProperty = {
        name: "flowchartDirection",
        displayName: "flowchart direction",
        type: "list",
        values: ["TD", "TB", "BT", "LR", "RL"],
        attributeName: mermaidFlowchartDirectionAttribute,
        service: this,
        propertyType: PropertyType.attribute,
    };

    private readonly _requirementDirectionProperty: IProperty = {
        name: "requirementDirection",
        displayName: "direction",
        type: "list",
        values: ["TB", "BT", "LR", "RL"],
        attributeName: mermaidFlowchartDirectionAttribute,
        service: this,
        propertyType: PropertyType.attribute,
    };

    private readonly _titleProperty: IProperty = {
        name: "title",
        displayName: "title",
        type: "string",
        attributeName: mermaidTitleAttribute,
        service: this,
        propertyType: PropertyType.attribute,
    };

    override getRefreshMode() {
        return RefreshMode.fullOnValueChange;
    }

    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.isRootItem;
    }

    override async getProperties(designItem: IDesignItem): Promise<IProperty[]> {
        const diagramType = getMermaidDocumentDiagramType(designItem);
        if (diagramType === "requirementDiagram")
            return [this._diagramTypeProperty, this._requirementDirectionProperty, this._titleProperty];
        if (diagramType === "sequenceDiagram" || diagramType === "mindmap")
            return [this._diagramTypeProperty, this._titleProperty];

        return [this._diagramTypeProperty, this._flowchartDirectionProperty, this._titleProperty];
    }

    override async getProperty(designItem: IDesignItem, name: string): Promise<IProperty> {
        if (name === this._diagramTypeProperty.name)
            return this._diagramTypeProperty;
        if (name === this._flowchartDirectionProperty.name)
            return this._flowchartDirectionProperty;
        if (name === this._requirementDirectionProperty.name)
            return this._requirementDirectionProperty;
        if (name === this._titleProperty.name)
            return this._titleProperty;
        return null;
    }

    override async setValue(designItems: IDesignItem[], property: IProperty, value: any): Promise<void> {
        const rootDesignItems = designItems.filter(designItem => this.isHandledElement(designItem));
        if (!rootDesignItems.length)
            return;

        const changeGroup = rootDesignItems[0].openGroup("mermaid document property changed: " + property.name + " to " + value);
        try {
            for (const designItem of rootDesignItems)
                setAttribute(designItem, property.attributeName, value);

            if (property.name === this._diagramTypeProperty.name && (value === "flowchart" || value === "requirementDiagram")) {
                for (const designItem of rootDesignItems) {
                    if (!designItem.hasAttribute(mermaidFlowchartDirectionAttribute))
                        setAttribute(designItem, mermaidFlowchartDirectionAttribute, value === "requirementDiagram" ? "TB" : "TD");
                }
            }

            if (property.name === this._flowchartDirectionProperty.name && isFlowchartDirection(value)) {
                for (const designItem of rootDesignItems)
                    updateFlowchartDirection(designItem, value);
            }
            changeGroup.commit();
        } catch (error) {
            changeGroup.abort();
            throw error;
        }
    }

    override getPropertyTarget(): BindingTarget {
        return BindingTarget.attribute;
    }

    override getValue(designItems: IDesignItem[], property: IProperty): any {
        const designItem = designItems?.[0];
        if (!designItem)
            return null;

        if (property.name === this._diagramTypeProperty.name)
            return getMermaidDocumentDiagramType(designItem);

        if (property.name === this._flowchartDirectionProperty.name)
            return getMermaidDocumentFlowchartDirection(designItem);
        if (property.name === this._requirementDirectionProperty.name)
            return getMermaidDocumentFlowchartDirection(designItem);

        if (property.name === this._titleProperty.name)
            return getMermaidDocumentTitle(designItem);

        return super.getValue(designItems, property);
    }

    override isSet(designItems: IDesignItem[], property: IProperty): ValueType {
        return this.getValue(designItems, property) != null ? ValueType.all : ValueType.none;
    }
}

export function getMermaidDocumentDiagramType(rootDesignItem: IDesignItem): MermaidDocumentDiagramType {
    const value = rootDesignItem?.getAttribute(mermaidDiagramTypeAttribute);
    if (value === "sequenceDiagram" || value === "mindmap" || value === "requirementDiagram")
        return value;
    return "flowchart";
}

export function getMermaidDocumentFlowchartDirection(rootDesignItem: IDesignItem) {
    return rootDesignItem?.getAttribute(mermaidFlowchartDirectionAttribute) ?? "TD";
}

export function getMermaidDocumentTitle(rootDesignItem: IDesignItem) {
    return rootDesignItem?.getAttribute(mermaidTitleAttribute) ?? "";
}

export function getMermaidDocumentFrontmatter(rootDesignItem: IDesignItem) {
    return rootDesignItem?.getAttribute(mermaidFrontmatterAttribute) ?? "";
}

function setAttribute(designItem: IDesignItem, attributeName: string, value: any) {
    if (value == null || value === "")
        designItem.removeAttribute(attributeName);
    else
        designItem.setAttribute(attributeName, value.toString());
}

function updateFlowchartDirection(rootDesignItem: IDesignItem, direction: FlowchartDirection) {
    const flowchartNodes: IDesignItem[] = [];
    for (const child of rootDesignItem.children(true)) {
        if (child.element.localName === "mermaid-node") {
            child.setAttribute("diagram-direction", direction);
            flowchartNodes.push(child);
        } else if (child.element.localName === "mermaid-edge") {
            child.setAttribute("diagram-direction", direction);
        }
    }
    rerouteConnectedMermaidEdges(rootDesignItem.instanceServiceContainer, flowchartNodes, true);
}

function isFlowchartDirection(value: string): value is FlowchartDirection {
    return value === "TB" || value === "TD" || value === "BT" || value === "RL" || value === "LR";
}
