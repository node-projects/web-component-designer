import type { IDesignItem, InstanceServiceContainer } from "@node-projects/web-component-designer";
import { encodeWaypoints, FlowchartDirection, routeBetweenBounds } from "./mermaidGeometry.js";

function isEdgeItem(designItem: IDesignItem) {
    return designItem.element.localName === "mermaid-edge" || designItem.element.localName === "mermaid-requirement-relationship";
}

function isNodeItem(designItem: IDesignItem) {
    return designItem.element.localName === "mermaid-node" || designItem.element.localName === "mermaid-requirement-node";
}

function getNodeId(designItem: IDesignItem) {
    if (designItem.element.localName === "mermaid-requirement-node")
        return designItem.element.getAttribute("label");
    return designItem.element.getAttribute("node-id");
}

function collectCanvasDesignItems(rootDesignItem: IDesignItem) {
    const allItems: IDesignItem[] = [];
    const stack = Array.from(rootDesignItem.children());

    while (stack.length) {
        const item = stack.pop()!;
        allItems.push(item);
        stack.push(...item.children());
    }

    return allItems;
}

function createNodeItemsById(rootItems: IDesignItem[]) {
    return new Map(
        rootItems
            .filter(isNodeItem)
            .map(item => [getNodeId(item), item] as const)
            .filter((entry): entry is [string, IDesignItem] => !!entry[0])
    );
}

export function rerouteConnectedMermaidEdges(instanceServiceContainer: InstanceServiceContainer, changedItems: IDesignItem[], operationFinished: boolean) {
    const changedNodeIds = new Set(
        changedItems
            .filter(isNodeItem)
            .map(getNodeId)
            .filter((id): id is string => !!id)
    );

    if (!changedNodeIds.size)
        return;

    const designerCanvas = instanceServiceContainer.designerCanvas;
    const rootItems = collectCanvasDesignItems(designerCanvas.rootDesignItem);
    const nodeItemsById = createNodeItemsById(rootItems);
    const affectedEdges = rootItems.filter(item => {
        if (!isEdgeItem(item))
            return false;

        const from = item.element.getAttribute("from");
        const to = item.element.getAttribute("to");
        return !!from && !!to && (changedNodeIds.has(from) || changedNodeIds.has(to));
    });

    for (const edgeItem of affectedEdges) {
        const sourceItem = nodeItemsById.get(edgeItem.element.getAttribute("from"));
        const targetItem = nodeItemsById.get(edgeItem.element.getAttribute("to"));
        if (!sourceItem || !targetItem)
            continue;

        const waypoints = encodeWaypoints(routeBetweenBounds(
            designerCanvas.getNormalizedElementCoordinates(sourceItem.element),
            designerCanvas.getNormalizedElementCoordinates(targetItem.element),
            getDiagramDirection(edgeItem)
        ));
        const edgeElement = edgeItem.element as HTMLElement & { setPreviewWaypoints?: (waypoints: string | null) => void };

        if (operationFinished) {
            edgeElement.setPreviewWaypoints?.(waypoints);
            if (edgeItem.getAttribute("waypoints") !== waypoints)
                edgeItem.setAttribute("waypoints", waypoints);
            queueMicrotask(() => edgeElement.setPreviewWaypoints?.(null));
        } else {
            edgeElement.setPreviewWaypoints?.(waypoints);
        }
    }
}

function getDiagramDirection(designItem: IDesignItem): FlowchartDirection {
    const direction = designItem.element.getAttribute("diagram-direction");
    if (direction === "TB" || direction === "TD" || direction === "BT" || direction === "RL" || direction === "LR")
        return direction;
    return undefined;
}
