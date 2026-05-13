import { DefaultPlacementService, IDesignItem, IDesignerCanvas, IPoint, filterChildPlaceItems } from "@node-projects/web-component-designer";

export class MermaidLayoutPlacementService extends DefaultPlacementService {
    override serviceForContainer(container: IDesignItem) {
        return container.element.localName === "mermaid-mindmap-node" || container.element.localName === "mermaid-subgraph";
    }

    override canEnter(container: IDesignItem, items: IDesignItem[]) {
        if (container.element.localName === "mermaid-mindmap-node")
            return items.every(item => item.element.localName === "mermaid-mindmap-node" && !item.element.contains(container.element) && item !== container);
        if (container.element.localName === "mermaid-subgraph")
            return items.every(item => (item.element.localName === "mermaid-node" || item.element.localName === "mermaid-subgraph") && !item.element.contains(container.element) && item !== container);
        return false;
    }

    override enterContainer(container: IDesignItem, items: IDesignItem[]) {
        const filteredItems = filterChildPlaceItems(items);
        for (const item of filteredItems) {
            if (item.element.localName === "mermaid-mindmap-node" || item.element.localName === "mermaid-node" || item.element.localName === "mermaid-subgraph")
                container.insertChild(item);
        }
    }

    override leaveContainer(container: IDesignItem, items: IDesignItem[]) {
    }

    override finishPlace(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
        super.finishPlace(event, designerCanvas, container, startPoint, offsetInControl, newPoint, items);
    }
}
