import { DesignItem, EventNames, IDesignerCanvas, InsertAction, ITool, OverlayLayer, ServiceContainer } from "@node-projects/web-component-designer";
import { encodeWaypoints, FlowchartDirection, getAnchor, Rect, routeBetweenBounds, routeBetweenPoints, pathDataFromWaypoints } from "../services/mermaidGeometry.js";
import { MermaidNode } from "../widgets/mermaid-node.js";
import { MermaidRequirementNode } from "../widgets/mermaid-requirement-node.js";
import { getMermaidDocumentDiagramType } from "../services/MermaidDocumentPropertiesService.js";

function createIcon(markup: string) {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`)}`;
}

function findNode(event: PointerEvent, currentElement: Element | null | undefined) {
    if (currentElement instanceof HTMLElement && isConnectableNode(currentElement))
        return currentElement;

    for (const part of event.composedPath()) {
        if (part instanceof HTMLElement && isConnectableNode(part))
            return part;
    }

    return null;
}

function isConnectableNode(element: HTMLElement) {
    return element.localName === MermaidNode.is || element.localName === MermaidRequirementNode.is;
}

function getElementBounds(designerCanvas: IDesignerCanvas, element: HTMLElement): Rect {
    const canvasRect = designerCanvas.canvas.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const zoom = designerCanvas.zoomFactor ?? 1;

    return {
        x: (elementRect.left - canvasRect.left) / zoom,
        y: (elementRect.top - canvasRect.top) / zoom,
        width: elementRect.width / zoom,
        height: elementRect.height / zoom,
    };
}

function getNodeId(element: HTMLElement) {
    if (element.localName === MermaidRequirementNode.is) {
        let id = element.getAttribute("label");
        if (!id) {
            id = `Req_${Math.random().toString(36).slice(2, 8)}`;
            element.setAttribute("label", id);
        }
        return id;
    }

    let id = element.getAttribute("node-id");
    if (!id) {
        id = `Node_${Math.random().toString(36).slice(2, 8)}`;
        element.setAttribute("node-id", id);
    }
    return id;
}

export const mermaidFlowIcon = createIcon('<path d="M4 12h12"/><path d="M12 8l4 4-4 4"/>');

export class ConnectMermaidNodesTool implements ITool {
    readonly cursor = "crosshair";

    private _captureElement?: Element;
    private _pointerId?: number;
    private _previewPath?: SVGPathElement;
    private _sourceElement?: HTMLElement;
    private _sourceBounds?: Rect;

    activated(_serviceContainer: ServiceContainer) {
    }

    dispose() {
    }

    pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
        switch (event.type) {
            case EventNames.PointerDown:
                this._begin(designerCanvas, event, currentElement);
                break;
            case EventNames.PointerMove:
                this._update(designerCanvas, event, currentElement);
                break;
            case EventNames.PointerUp:
                this._finish(designerCanvas, event, currentElement);
                break;
        }
    }

    keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent) {
        if (event.key === "Escape")
            this._cleanup(designerCanvas, true);
    }

    private _begin(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
        const source = findNode(event, currentElement);
        if (!source)
            return;

        this._sourceElement = source;
        this._sourceBounds = getElementBounds(designerCanvas, source);
        this._captureElement = event.target as Element;
        this._pointerId = event.pointerId;
        this._captureElement?.setPointerCapture?.(this._pointerId);
        designerCanvas.captureActiveTool(this);

        this._previewPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._previewPath.setAttribute("fill", "none");
        this._previewPath.setAttribute("stroke", "#333");
        this._previewPath.setAttribute("stroke-width", "2.5");
        designerCanvas.overlayLayer.addOverlay(this.constructor.name, this._previewPath, OverlayLayer.Foreground);
        this._update(designerCanvas, event, currentElement);
        event.preventDefault();
        event.stopPropagation();
    }

    private _update(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
        if (!this._sourceBounds || !this._previewPath)
            return;

        const pointer = designerCanvas.getNormalizedEventCoordinates(event);
        const target = findNode(event, currentElement);
        const direction = this._getDirection();
        const waypoints = target && target !== this._sourceElement
            ? routeBetweenBounds(this._sourceBounds, getElementBounds(designerCanvas, target), direction)
            : routeBetweenPoints(getAnchor(this._sourceBounds, pointer), pointer);

        this._previewPath.setAttribute("d", pathDataFromWaypoints(waypoints));
        event.preventDefault();
        event.stopPropagation();
    }

    private _finish(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
        if (!this._sourceElement || !this._sourceBounds)
            return;

        const target = findNode(event, currentElement);
        if (!target || target === this._sourceElement) {
            this._cleanup(designerCanvas, true);
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const direction = this._getDirection(target);
        const waypoints = routeBetweenBounds(this._sourceBounds, getElementBounds(designerCanvas, target), direction);
        const edge = document.createElement(this._getRelationshipTag(designerCanvas)) as HTMLElement;
        edge.style.position = "absolute";
        edge.style.zIndex = "4";
        edge.setAttribute("from", getNodeId(this._sourceElement));
        edge.setAttribute("to", getNodeId(target));
        if (edge.localName === "mermaid-edge")
            edge.setAttribute("edge-type", "arrow");
        else
            edge.setAttribute("relationship-type", "satisfies");
        if (direction && edge.localName === "mermaid-edge")
            edge.setAttribute("diagram-direction", direction);
        edge.setAttribute("waypoints", encodeWaypoints(waypoints));

        const designItem = DesignItem.createDesignItemFromInstance(edge, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        designerCanvas.instanceServiceContainer.undoService.execute(
            new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, designItem)
        );
        this._cleanup(designerCanvas, true);
        event.preventDefault();
        event.stopPropagation();
    }

    private _cleanup(designerCanvas: IDesignerCanvas, finished: boolean) {
        if (this._previewPath) {
            designerCanvas.overlayLayer.removeOverlay(this._previewPath);
            this._previewPath = undefined;
        }
        if (this._captureElement && this._pointerId !== undefined)
            this._captureElement.releasePointerCapture?.(this._pointerId);

        this._captureElement = undefined;
        this._pointerId = undefined;
        this._sourceElement = undefined;
        this._sourceBounds = undefined;
        designerCanvas.releaseActiveTool();
        if (finished)
            designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
    }

    private _getDirection(target?: HTMLElement): FlowchartDirection {
        const direction = this._sourceElement?.getAttribute("diagram-direction") ?? target?.getAttribute("diagram-direction");
        if (direction === "TB" || direction === "TD" || direction === "BT" || direction === "RL" || direction === "LR")
            return direction;
        return undefined;
    }

    private _getRelationshipTag(designerCanvas: IDesignerCanvas) {
        return getMermaidDocumentDiagramType(designerCanvas.rootDesignItem) === "requirementDiagram"
            ? "mermaid-requirement-relationship"
            : "mermaid-edge";
    }
}
