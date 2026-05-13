import { DesignItem, IDesignItem, IHtmlParserService, IHtmlWriterOptions, IHtmlWriterService, InstanceServiceContainer, ITextWriter, ServiceContainer } from "@node-projects/web-component-designer";
import { MermaidEdge } from "../widgets/mermaid-edge.js";
import { MermaidNode, normalizeLabelLineBreaks } from "../widgets/mermaid-node.js";
import { MermaidSequenceMessage } from "../widgets/mermaid-sequence-message.js";
import { MermaidSequenceParticipant } from "../widgets/mermaid-sequence-participant.js";
import { MermaidMindmapNode } from "../widgets/mermaid-mindmap-node.js";
import { MermaidRequirementNode } from "../widgets/mermaid-requirement-node.js";
import { MermaidRequirementRelationship } from "../widgets/mermaid-requirement-relationship.js";
import { MermaidSubgraph } from "../widgets/mermaid-subgraph.js";
import { MermaidFlowchartDirective } from "../widgets/mermaid-flowchart-directive.js";
import { getMermaidDocumentDiagramType, getMermaidDocumentFrontmatter, getMermaidDocumentTitle, mermaidDiagramTypeAttribute, mermaidFlowchartDirectionAttribute, mermaidFrontmatterAttribute, mermaidTitleAttribute, MermaidDocumentDiagramType } from "./MermaidDocumentPropertiesService.js";
import { encodeWaypoints, FlowchartDirection, routeBetweenBounds } from "./mermaidGeometry.js";

type ParsedNode = {
    id: string;
    label: string;
    shape: string;
    parentId?: string;
    classes?: string;
    style?: string;
    sourceRange?: { start: number; length: number };
}

type ParsedEdge = {
    from: string;
    to: string;
    fromNode?: ParsedNode;
    toNode?: ParsedNode;
    label: string;
    edgeType: string;
    connector?: string;
    edgeId?: string;
    animation?: string;
    connectorRange?: { start: number; length: number };
    sourceRange?: { start: number; length: number };
}

type ParsedSubgraph = {
    id: string;
    title: string;
    parentId?: string;
    direction?: FlowchartDirection;
    sourceRange?: { start: number; length: number };
}

type ParsedFlowchartDirective = {
    line: string;
    sourceRange?: { start: number; length: number };
}

type ParsedSequenceParticipant = {
    id: string;
    label: string;
    participantType: string;
    implicit?: boolean;
    sourceRange?: { start: number; length: number };
}

type ParsedSequenceMessage = {
    from: string;
    to: string;
    label: string;
    messageType: string;
    connector: string;
    sourceRange?: { start: number; length: number };
}

type ParsedMindmapNode = {
    id: string;
    parentId: string;
    label: string;
    shape: string;
    indent: number;
    sourceRange?: { start: number; length: number };
}

type ParsedRequirementNode = {
    id: string;
    kind: "requirement" | "element";
    requirementType?: string;
    requirementId?: string;
    text?: string;
    risk?: string;
    verifyMethod?: string;
    elementType?: string;
    docRef?: string;
    sourceRange?: { start: number; length: number };
}

type ParsedRequirementRelationship = {
    from: string;
    to: string;
    relationshipType: string;
    syntaxDirection: "forward" | "reverse";
    sourceRange?: { start: number; length: number };
}

type LineRecord = {
    text: string;
    trimmed: string;
    indent: number;
    start: number;
}

type ParsedMermaidDocument = {
    lines: LineRecord[];
    title: string;
    frontmatter: string;
}

export class MermaidParserService implements IHtmlParserService, IHtmlWriterService {
    options: IHtmlWriterOptions = {};
    supportsRootItemWrite = true;

    async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean): Promise<IDesignItem[]> {
        const diagramKind = getDiagramKind(readMermaidDocument(html));
        if (diagramKind === "sequence")
            return parseSequenceDiagram(html, serviceContainer, instanceServiceContainer);
        if (diagramKind === "mindmap")
            return parseMindmapDiagram(html, serviceContainer, instanceServiceContainer);
        if (diagramKind === "requirementDiagram")
            return parseRequirementDiagram(html, serviceContainer, instanceServiceContainer);
        return parseFlowchart(html, serviceContainer, instanceServiceContainer);
    }

    write(textWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, updatePositions?: boolean) {
        const rootDesignItem = getRootDesignItem(designItems);
        const mermaidDesignItems = getMermaidDesignItems(designItems);
        const documentType = getWritableDocumentDiagramType(mermaidDesignItems.length ? mermaidDesignItems : designItems);
        if (documentType === "mindmap") {
            writeMindmapDiagram(textWriter, mermaidDesignItems, updatePositions, rootDesignItem);
            return;
        }
        if (documentType === "sequenceDiagram") {
            writeSequenceDiagram(textWriter, mermaidDesignItems, updatePositions, rootDesignItem);
            return;
        }
        if (documentType === "requirementDiagram") {
            writeRequirementDiagram(textWriter, mermaidDesignItems, updatePositions, rootDesignItem);
            return;
        }

        writeFlowchart(textWriter, mermaidDesignItems, updatePositions, rootDesignItem);
    }
}

function getDiagramKind(document: ParsedMermaidDocument) {
    const firstMeaningfulLine = document.lines.find(line => line.trimmed && !line.trimmed.startsWith("%%"))?.trimmed ?? "";
    if (equalsIgnoreCase(firstMeaningfulLine, "sequenceDiagram"))
        return "sequence";
    if (equalsIgnoreCase(firstMeaningfulLine, "mindmap"))
        return "mindmap";
    if (equalsIgnoreCase(firstMeaningfulLine, "requirementDiagram"))
        return "requirementDiagram";
    return "flowchart";
}

async function parseFlowchart(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
        const document = readMermaidDocument(html);
        const lines = document.lines;
        const designItems: IDesignItem[] = [];
        const nodes = new Map<string, ParsedNode>();
        const nodeBounds = new Map<string, { x: number; y: number; width: number; height: number }>();
        const edges: ParsedEdge[] = [];
        const subgraphs = new Map<string, ParsedSubgraph>();
        const directives: ParsedFlowchartDirective[] = [];
        const subgraphStack: ParsedSubgraph[] = [];
        let direction: FlowchartDirection = "TD";
        const scannedNodes = new Map<string, ParsedNode>();
        const scannedEdges: ParsedEdge[] = [];

        for (const line of lines) {
            if (!line.trimmed || line.trimmed.startsWith("%%"))
                continue;

            const subgraph = parseSubgraphStart(line.trimmed, line.start, subgraphStack[subgraphStack.length - 1]?.id);
            if (subgraph) {
                subgraphs.set(subgraph.id, subgraph);
                subgraphStack.push(subgraph);
                continue;
            }

            if (equalsIgnoreCase(line.trimmed, "end")) {
                subgraphStack.pop();
                continue;
            }

            const directive = parseFlowchartDirective(line.trimmed, line.start);
            if (directive) {
                directives.push(directive);
                continue;
            }

            const parsedDirection = parseFlowchartDirection(line.trimmed);
            if (parsedDirection) {
                if (subgraphStack.length)
                    subgraphStack[subgraphStack.length - 1].direction = parsedDirection;
                else
                    direction = parsedDirection;
                continue;
            }
            const parsedSubgraphDirection = parseDirectionStatement(line.trimmed);
            if (parsedSubgraphDirection && subgraphStack.length) {
                subgraphStack[subgraphStack.length - 1].direction = parsedSubgraphDirection;
                continue;
            }

            const edge = parseEdge(line.trimmed, line.start);
            if (edge) {
                scannedEdges.push(edge);
                mergeNode(scannedNodes, edge.fromNode);
                mergeNode(scannedNodes, edge.toNode);
                continue;
            }

            const node = parseNode(line.trimmed, line.start);
            if (node) {
                node.parentId = subgraphStack[subgraphStack.length - 1]?.id;
                mergeNode(scannedNodes, node);
            }
        }

        setMermaidDocumentAttributes(instanceServiceContainer, "flowchart", direction, document.title, document.frontmatter);
        const parsed = await getMermaidFlowchartData(html);
        if (parsed) {
            for (const node of parsed.nodes) {
                const scanned = scannedNodes.get(node.id);
                mergeNode(nodes, { ...node, parentId: scanned?.parentId, classes: scanned?.classes, style: scanned?.style, sourceRange: scanned?.sourceRange });
            }
            for (const edge of parsed.edges) {
                const scanned = getScannedEdge(scannedEdges, edge);
                edges.push({ ...edge, ...scanned });
            }
        } else {
            for (const node of scannedNodes.values())
                mergeNode(nodes, node);
            edges.push(...scannedEdges);
        }

        const mermaidLayout = await getMermaidLayout(html, nodes);
        const designItemsById = new Map<string, IDesignItem>();
        let subgraphIndex = 0;
        for (const subgraph of subgraphs.values()) {
            const layout = mermaidLayout?.subgraphs?.get(subgraph.id);
            const element = new MermaidSubgraph();
            element.style.position = "absolute";
            element.style.left = (layout?.x ?? (30 + subgraphIndex * 40)) + "px";
            element.style.top = (layout?.y ?? (30 + subgraphIndex * 40)) + "px";
            element.style.width = (layout?.width ?? 360) + "px";
            element.style.height = (layout?.height ?? 240) + "px";
            element.setAttribute("subgraph-id", subgraph.id);
            element.setAttribute("title", subgraph.title);
            if (subgraph.direction)
                element.setAttribute("direction", subgraph.direction);
            const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
            designItemsById.set(subgraph.id, designItem);
            const parentItem = designItemsById.get(subgraph.parentId);
            if (parentItem)
                parentItem._insertChildInternal(designItem);
            else
                designItems.push(designItem);
            if (subgraph.sourceRange)
                instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, subgraph.sourceRange);
            subgraphIndex++;
        }

        let index = 0;
        for (const node of nodes.values()) {
            const layout = mermaidLayout?.nodes.get(node.id);
            const parentLayout = node.parentId ? mermaidLayout?.subgraphs?.get(node.parentId) : null;
            const fallbackPosition = getFallbackFlowchartNodePosition(index, nodes.size, direction);
            const left = layout ? layout.x - (parentLayout?.x ?? 0) : fallbackPosition.left;
            const top = layout ? layout.y - (parentLayout?.y ?? 0) : fallbackPosition.top;
            const width = layout?.width ?? getDefaultNodeSize(node.shape).width;
            const height = layout?.height ?? getDefaultNodeSize(node.shape).height;
            const element = new MermaidNode();
            element.style.position = "absolute";
            element.style.left = left + "px";
            element.style.top = top + "px";
            element.style.width = width + "px";
            element.style.height = height + "px";
            element.setAttribute("node-id", node.id);
            element.setAttribute("label", node.label);
            element.setAttribute("shape", node.shape);
            element.setAttribute("diagram-direction", direction);
            if (node.classes)
                element.setAttribute("classes", node.classes);
            if (node.style)
                element.setAttribute("style-directive", node.style);
            const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
            const parentItem = designItemsById.get(node.parentId);
            if (parentItem)
                parentItem._insertChildInternal(designItem);
            else
                designItems.push(designItem);
            designItemsById.set(node.id, designItem);
            if (node.sourceRange)
                instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, node.sourceRange);
            nodeBounds.set(node.id, { x: layout?.x ?? left, y: layout?.y ?? top, width, height });
            index++;
        }

        let edgeIndex = 0;
        for (const edge of edges) {
            const element = new MermaidEdge();
            element.style.position = "absolute";
            element.style.left = "40px";
            element.style.top = 60 + index * 110 + edgeIndex * 44 + "px";
            element.style.width = "220px";
            element.style.height = "28px";
            element.setAttribute("from", edge.from);
            element.setAttribute("to", edge.to);
            element.setAttribute("label", edge.label);
            element.setAttribute("edge-type", edge.edgeType);
            if (edge.connector)
                element.setAttribute("connector", edge.connector);
            if (edge.edgeId)
                element.setAttribute("edge-id", edge.edgeId);
            if (edge.animation)
                element.setAttribute("animation", edge.animation);
            element.setAttribute("diagram-direction", direction);
            const sourceBounds = nodeBounds.get(edge.from);
            const targetBounds = nodeBounds.get(edge.to);
            if (sourceBounds && targetBounds)
                element.setAttribute("waypoints", encodeWaypoints(routeBetweenBounds(sourceBounds, targetBounds, direction)));
            const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
            designItems.push(designItem);
            if (edge.sourceRange)
                instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, edge.connectorRange ?? edge.sourceRange);
            edgeIndex++;
        }

        let directiveIndex = 0;
        for (const directive of directives) {
            const element = new MermaidFlowchartDirective();
            element.style.position = "absolute";
            element.style.left = "40px";
            element.style.top = 60 + index * 110 + edgeIndex * 44 + directiveIndex * 28 + "px";
            element.style.width = "320px";
            element.style.height = "24px";
            element.setAttribute("line", directive.line);
            const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
            designItems.push(designItem);
            if (directive.sourceRange)
                instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, directive.sourceRange);
            directiveIndex++;
        }

        return designItems;
}

function writeFlowchart(textWriter: ITextWriter, designItems: IDesignItem[], updatePositions?: boolean, rootDesignItem?: IDesignItem) {
        const rootDirection = rootDesignItem?.getAttribute(mermaidFlowchartDirectionAttribute);
        const direction = isFlowchartDirection(rootDirection) ? rootDirection : getDiagramDirection(designItems);
        writeMermaidFrontmatter(textWriter, designItems, rootDesignItem);
        textWriter.writeLine("flowchart " + direction);
        const allFlowchartItems = getAllFlowchartItems(designItems);
        const nodeIdsUsedByEdges = getFlowchartNodeIdsUsedByEdges(allFlowchartItems);
        const nodeItemsById = getFlowchartNodeItemsById(allFlowchartItems);
        const explicitlyWrittenNodeIds = new Set<string>();

        const writeNodeOrSubgraph = (designItem: IDesignItem, depth: number) => {
            const element = designItem.element as HTMLElement & { createMermaid?: () => string };
            if (element.nodeName === "MERMAID-SUBGRAPH") {
                const subgraphElement = element as HTMLElement & { createMermaidStart?: () => string };
                writeDesignItemLine(textWriter, designItem, repeatText("    ", depth) + subgraphElement.createMermaidStart(), updatePositions);
                const subgraphDirection = element.getAttribute("direction");
                if (isFlowchartDirection(subgraphDirection))
                    textWriter.writeLine(repeatText("    ", depth + 1) + "direction " + subgraphDirection);
                for (const child of designItem.children())
                    writeNodeOrSubgraph(child, depth + 1);
                textWriter.writeLine(repeatText("    ", depth) + "end");
            } else if (element.nodeName === "MERMAID-NODE" && element.createMermaid && shouldWriteFlowchartNode(element, nodeIdsUsedByEdges)) {
                writeDesignItemLine(textWriter, designItem, repeatText("    ", depth) + element.createMermaid(), updatePositions);
                explicitlyWrittenNodeIds.add(element.getAttribute("node-id"));
            }
        };

        for (const designItem of designItems) {
            writeNodeOrSubgraph(designItem, 1);
        }
        for (const designItem of allFlowchartItems) {
            const element = designItem.element as HTMLElement & { createMermaid?: () => string };
            if (element.nodeName === "MERMAID-EDGE" && element.createMermaid)
                writeFlowchartEdgeLine(textWriter, designItem, element, nodeItemsById, explicitlyWrittenNodeIds, updatePositions);
        }
        for (const designItem of allFlowchartItems) {
            const element = designItem.element as HTMLElement & { createMermaid?: () => string };
            if (element.nodeName === "MERMAID-FLOWCHART-DIRECTIVE" && element.createMermaid)
                writeDesignItemLine(textWriter, designItem, "    " + element.createMermaid(), updatePositions);
        }
}

function writeFlowchartEdgeLine(textWriter: ITextWriter, designItem: IDesignItem, element: HTMLElement & { createMermaid?: () => string }, nodeItemsById: Map<string, IDesignItem>, explicitlyWrittenNodeIds: Set<string>, updatePositions?: boolean) {
    const start = textWriter.position;
    const line = indentEmbeddedNewlines("    " + element.createMermaid());
    textWriter.writeLine(line);
    if (!updatePositions)
        return;

    const from = element.getAttribute("from");
    const to = element.getAttribute("to");
    const fromIndex = from ? line.indexOf(from) : -1;
    const toIndex = to ? line.lastIndexOf(to) : -1;

    if (from && fromIndex >= 0 && !explicitlyWrittenNodeIds.has(from))
        nodeItemsById.get(from)?.instanceServiceContainer.designItemDocumentPositionService?.setPosition(nodeItemsById.get(from), { start: start + fromIndex, length: from.length });
    if (to && toIndex >= 0 && !explicitlyWrittenNodeIds.has(to))
        nodeItemsById.get(to)?.instanceServiceContainer.designItemDocumentPositionService?.setPosition(nodeItemsById.get(to), { start: start + toIndex, length: to.length });

    if (fromIndex >= 0 && toIndex > fromIndex) {
        const connectorStart = fromIndex + from.length;
        designItem.instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, { start: start + connectorStart, length: toIndex - connectorStart });
    } else {
        designItem.instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, { start, length: line.length });
    }
}

function getFlowchartNodeIdsUsedByEdges(designItems: IDesignItem[]) {
    const ids = new Set<string>();
    for (const designItem of designItems) {
        const element = designItem.element as HTMLElement;
        if (element.nodeName === "MERMAID-EDGE") {
            const from = element.getAttribute("from");
            const to = element.getAttribute("to");
            if (from)
                ids.add(from);
            if (to)
                ids.add(to);
        }
    }
    return ids;
}

function getFlowchartNodeItemsById(designItems: IDesignItem[]) {
    const nodeItemsById = new Map<string, IDesignItem>();
    for (const designItem of designItems) {
        const element = designItem.element as HTMLElement;
        if (element.nodeName === "MERMAID-NODE") {
            const id = element.getAttribute("node-id");
            if (id)
                nodeItemsById.set(id, designItem);
        }
    }
    return nodeItemsById;
}

function getAllFlowchartItems(designItems: IDesignItem[]) {
    const result: IDesignItem[] = [];
    const append = (item: IDesignItem) => {
        result.push(item);
        for (const child of item.children())
            append(child);
    };
    for (const designItem of designItems)
        append(designItem);
    return result;
}

function shouldWriteFlowchartNode(element: HTMLElement, nodeIdsUsedByEdges: Set<string>) {
    const id = element.getAttribute("node-id");
    const label = element.getAttribute("label");
    const shape = element.getAttribute("shape") ?? "rectangle";
    if (!nodeIdsUsedByEdges.has(id))
        return true;
    return shape !== "rectangle" || (label && label !== id);
}

async function parseSequenceDiagram(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    const document = readMermaidDocument(html);
    setMermaidDocumentAttributes(instanceServiceContainer, "sequenceDiagram", undefined, document.title, document.frontmatter);
    const lines = document.lines;
    const participants = new Map<string, ParsedSequenceParticipant>();
    const messages: ParsedSequenceMessage[] = [];
    const scannedParticipants = new Map<string, ParsedSequenceParticipant>();
    const scannedMessages: ParsedSequenceMessage[] = [];

    for (const line of lines) {
        if (!line.trimmed || line.trimmed.startsWith("%%") || equalsIgnoreCase(line.trimmed, "sequenceDiagram"))
            continue;

        const participant = parseSequenceParticipant(line.trimmed, line.start);
        if (participant) {
            scannedParticipants.set(participant.id, participant);
            continue;
        }

        const message = parseSequenceMessage(line.trimmed, line.start);
        if (message) {
            scannedMessages.push(message);
        }
    }

    const parsed = await getMermaidSequenceData(html);
    if (parsed) {
        for (const participant of parsed.participants) {
            const scanned = scannedParticipants.get(participant.id);
            participants.set(participant.id, {
                ...participant,
                implicit: !scanned,
                sourceRange: scanned?.sourceRange,
            });
        }
        for (let i = 0; i < parsed.messages.length; i++) {
            messages.push({
                ...parsed.messages[i],
                sourceRange: scannedMessages[i]?.sourceRange,
            });
        }
    } else {
        for (const participant of scannedParticipants.values())
            participants.set(participant.id, participant);
        messages.push(...scannedMessages);
    }

    for (const message of messages) {
        ensureSequenceParticipant(participants, message.from);
        ensureSequenceParticipant(participants, message.to);
    }

    const designItems: IDesignItem[] = [];
    const participantBounds = new Map<string, { x: number; y: number; width: number; height: number }>();
    let index = 0;
    for (const participant of participants.values()) {
        const width = 140;
        const height = 44;
        const left = 60 + index * 220;
        const top = 40;
        const element = new MermaidSequenceParticipant();
        element.style.position = "absolute";
        element.style.left = left + "px";
        element.style.top = top + "px";
        element.style.width = width + "px";
        element.style.height = height + "px";
        element.setAttribute("participant-id", participant.id);
        element.setAttribute("label", participant.label);
        element.setAttribute("participant-type", participant.participantType);
        if (participant.implicit)
            element.setAttribute("implicit", "true");
        const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
        designItems.push(designItem);
        if (participant.sourceRange)
            instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, participant.sourceRange);
        participantBounds.set(participant.id, { x: left, y: top, width, height });
        index++;
    }

    let messageIndex = 0;
    for (const message of messages) {
        const fromBounds = participantBounds.get(message.from);
        const toBounds = participantBounds.get(message.to);
        const y = 130 + messageIndex * 54;
        const startX = fromBounds ? fromBounds.x + fromBounds.width / 2 : 60;
        const endX = toBounds ? toBounds.x + toBounds.width / 2 : startX + 220;
        const left = Math.min(startX, endX);
        const width = Math.max(80, Math.abs(endX - startX));
        const element = new MermaidSequenceMessage();
        element.style.position = "absolute";
        element.style.left = left + "px";
        element.style.top = y + "px";
        element.style.width = width + "px";
        element.style.height = "36px";
        element.setAttribute("from", message.from);
        element.setAttribute("to", message.to);
        element.setAttribute("label", message.label);
        element.setAttribute("message-type", message.messageType);
        element.setAttribute("connector", message.connector);
        const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
        designItems.push(designItem);
        if (message.sourceRange)
            instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, message.sourceRange);
        messageIndex++;
    }

    return designItems;
}

function writeSequenceDiagram(textWriter: ITextWriter, designItems: IDesignItem[], updatePositions?: boolean, rootDesignItem?: IDesignItem) {
    writeMermaidFrontmatter(textWriter, designItems, rootDesignItem);
    textWriter.writeLine("sequenceDiagram");
    for (const designItem of designItems) {
        const element = designItem.element as HTMLElement & { createMermaid?: () => string };
        if (element.nodeName === "MERMAID-SEQUENCE-PARTICIPANT" && element.getAttribute("implicit") !== "true" && element.createMermaid)
            writeDesignItemLine(textWriter, designItem, "    " + element.createMermaid(), updatePositions);
    }
    for (const designItem of designItems) {
        const element = designItem.element as HTMLElement & { createMermaid?: () => string };
        if (element.nodeName === "MERMAID-SEQUENCE-MESSAGE" && element.createMermaid)
            writeDesignItemLine(textWriter, designItem, "    " + element.createMermaid(), updatePositions);
    }
}

async function parseMindmapDiagram(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    const document = readMermaidDocument(html);
    setMermaidDocumentAttributes(instanceServiceContainer, "mindmap", undefined, document.title, document.frontmatter);

    const parsedNodes: ParsedMindmapNode[] = [];
    const parentStack: ParsedMindmapNode[] = [];
    let index = 0;

    for (const line of document.lines) {
        if (!line.trimmed || line.trimmed.startsWith("%%") || equalsIgnoreCase(line.trimmed, "mindmap"))
            continue;

        while (parentStack.length && parentStack[parentStack.length - 1].indent >= line.indent)
            parentStack.pop();

        const parent = parentStack[parentStack.length - 1];
        const parsed = parseMindmapNode(line.trimmed, index, parent?.id ?? "", line.start, line.text.length, line.indent);
        parsedNodes.push(parsed);
        parentStack.push(parsed);
        index++;
    }

    const siblingsByParent = new Map<string, number>();
    const designItemsById = new Map<string, IDesignItem>();
    const rootDesignItems: IDesignItem[] = [];
    const mermaidLayout = await getMermaidMindmapLayout(html, parsedNodes);
    for (const node of parsedNodes) {
        const siblingIndex = siblingsByParent.get(node.parentId) ?? 0;
        siblingsByParent.set(node.parentId, siblingIndex + 1);
        const layout = mermaidLayout?.nodes.get(node.id);
        const parentLayout = node.parentId ? mermaidLayout?.nodes.get(node.parentId) : null;
        const left = layout ? layout.x - (parentLayout?.x ?? 0) : (node.parentId ? 220 : 40);
        const top = layout ? layout.y - (parentLayout?.y ?? 0) : (node.parentId ? siblingIndex * 76 : 40 + rootDesignItems.length * 96);
        const element = new MermaidMindmapNode();
        element.style.position = "absolute";
        element.style.left = left + "px";
        element.style.top = top + "px";
        element.style.width = (layout?.width ?? getDefaultMindmapNodeSize(node.shape).width) + "px";
        element.style.height = (layout?.height ?? getDefaultMindmapNodeSize(node.shape).height) + "px";
        element.setAttribute("mindmap-id", node.id);
        element.setAttribute("label", node.label);
        element.setAttribute("shape", node.shape);
        const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
        designItemsById.set(node.id, designItem);
        const parentItem = designItemsById.get(node.parentId);
        if (parentItem) {
            parentItem._insertChildInternal(designItem);
        } else {
            rootDesignItems.push(designItem);
        }
        if (node.sourceRange)
            instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, node.sourceRange);
    }

    return rootDesignItems;
}

function writeMindmapDiagram(textWriter: ITextWriter, designItems: IDesignItem[], updatePositions?: boolean, rootDesignItem?: IDesignItem) {
    writeMermaidFrontmatter(textWriter, designItems, rootDesignItem);
    textWriter.writeLine("mindmap");
    const writeItems = (items: IDesignItem[], depth: number) => {
        for (const item of sortMindmapItems(items)) {
            const element = item.element as HTMLElement & { createMermaid?: () => string };
            if (!element.createMermaid)
                continue;
            writeDesignItemLine(textWriter, item, repeatText("    ", depth + 1) + element.createMermaid(), updatePositions);
            writeItems(Array.from(item.children()).filter(child => child.element.localName === MermaidMindmapNode.is), depth + 1);
        }
    };
    writeItems(designItems.filter(designItem => designItem.element.localName === MermaidMindmapNode.is), 0);
}

async function parseRequirementDiagram(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    const document = readMermaidDocument(html);
    const lines = document.lines;
    const nodes = new Map<string, ParsedRequirementNode>();
    const relationships: ParsedRequirementRelationship[] = [];
    let direction: FlowchartDirection = "TB";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trimmed || line.trimmed.startsWith("%%") || equalsIgnoreCase(line.trimmed, "requirementDiagram"))
            continue;

        const parsedDirection = parseDirectionStatement(line.trimmed);
        if (parsedDirection) {
            direction = parsedDirection;
            continue;
        }

        const blockStart = parseRequirementBlockStart(line.trimmed);
        if (blockStart) {
            const blockLines: LineRecord[] = [];
            const start = line.start;
            while (++i < lines.length) {
                if (lines[i].trimmed === "}")
                    break;
                blockLines.push(lines[i]);
            }
            const endLine = lines[Math.min(i, lines.length - 1)] ?? line;
            const node = parseRequirementBlock(blockStart, blockLines, start, endLine.start + endLine.text.length - start);
            nodes.set(node.id, node);
            continue;
        }

        const relationship = parseRequirementRelationship(line.trimmed, line.start);
        if (relationship)
            relationships.push(relationship);
    }

    setMermaidDocumentAttributes(instanceServiceContainer, "requirementDiagram", direction, document.title, document.frontmatter);

    const designItems: IDesignItem[] = [];
    const nodeBounds = new Map<string, { x: number; y: number; width: number; height: number }>();
    const mermaidLayout = await getMermaidRequirementLayout(html, nodes);
    let index = 0;
    for (const node of nodes.values()) {
        const fallbackPosition = getFallbackRequirementNodePosition(index, nodes.size, direction);
        const layout = mermaidLayout?.nodes.get(node.id);
        const size = getDefaultRequirementNodeSize(node);
        const left = layout?.x ?? fallbackPosition.left;
        const top = layout?.y ?? fallbackPosition.top;
        const width = layout?.width ?? size.width;
        const height = layout?.height ?? size.height;
        const element = new MermaidRequirementNode();
        element.style.position = "absolute";
        element.style.left = left + "px";
        element.style.top = top + "px";
        element.style.width = width + "px";
        element.style.height = height + "px";
        element.setAttribute("node-kind", node.kind);
        element.setAttribute("label", node.id);
        if (node.kind === "requirement") {
            element.setAttribute("requirement-type", node.requirementType ?? "requirement");
            element.setAttribute("requirement-id", node.requirementId ?? "");
            element.setAttribute("text", node.text ?? "");
            element.setAttribute("risk", node.risk ?? "");
            element.setAttribute("verify-method", node.verifyMethod ?? "");
        } else {
            element.setAttribute("element-type", node.elementType ?? "");
            element.setAttribute("doc-ref", node.docRef ?? "");
        }
        const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
        designItems.push(designItem);
        if (node.sourceRange)
            instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, node.sourceRange);
        nodeBounds.set(node.id, { x: left, y: top, width, height });
        index++;
    }

    let relationshipIndex = 0;
    for (const relationship of relationships) {
        const element = new MermaidRequirementRelationship();
        element.style.position = "absolute";
        element.setAttribute("from", relationship.from);
        element.setAttribute("to", relationship.to);
        element.setAttribute("relationship-type", relationship.relationshipType);
        element.setAttribute("syntax-direction", relationship.syntaxDirection);
        const sourceBounds = nodeBounds.get(relationship.from);
        const targetBounds = nodeBounds.get(relationship.to);
        if (sourceBounds && targetBounds) {
            element.setAttribute("waypoints", encodeWaypoints(routeBetweenBounds(sourceBounds, targetBounds, direction)));
        } else {
            element.style.left = "40px";
            element.style.top = 80 + index * 120 + relationshipIndex * 40 + "px";
            element.style.width = "220px";
            element.style.height = "28px";
        }
        const designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
        designItems.push(designItem);
        if (relationship.sourceRange)
            instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, relationship.sourceRange);
        relationshipIndex++;
    }

    return designItems;
}

function writeRequirementDiagram(textWriter: ITextWriter, designItems: IDesignItem[], updatePositions?: boolean, rootDesignItem?: IDesignItem) {
    const rootDirection = rootDesignItem?.getAttribute(mermaidFlowchartDirectionAttribute);
    const direction = isRequirementDirection(rootDirection) ? rootDirection : "TB";
    writeMermaidFrontmatter(textWriter, designItems, rootDesignItem);
    textWriter.writeLine("requirementDiagram");
    if (direction !== "TB")
        textWriter.writeLine("    direction " + direction);
    for (const designItem of designItems) {
        const element = designItem.element as HTMLElement & { createMermaid?: () => string };
        if (element.nodeName === "MERMAID-REQUIREMENT-NODE" && element.createMermaid)
            writeDesignItemLine(textWriter, designItem, "    " + element.createMermaid(), updatePositions);
    }
    for (const designItem of designItems) {
        const element = designItem.element as HTMLElement & { createMermaid?: () => string };
        if (element.nodeName === "MERMAID-REQUIREMENT-RELATIONSHIP" && element.createMermaid)
            writeDesignItemLine(textWriter, designItem, "    " + element.createMermaid(), updatePositions);
    }
}

function parseSequenceParticipant(line: string, sourceStart: number): ParsedSequenceParticipant {
    const cursor = new SourceCursor(line);
    const keyword = cursor.readIdentifier();
    if (!equalsIgnoreCase(keyword, "participant") && !equalsIgnoreCase(keyword, "actor"))
        return null;
    if (!cursor.skipRequiredWhitespace())
        return null;
    const id = cursor.readIdentifier();
    if (!id)
        return null;

    let label = id;
    cursor.skipWhitespace();
    if (!cursor.atEnd()) {
        const marker = cursor.readIdentifier();
        if (!equalsIgnoreCase(marker, "as"))
            return null;
        if (!cursor.skipRequiredWhitespace())
            return null;
        label = cursor.readRest().trim();
    }

    return {
        id,
        label: unquoteLabel(label),
        participantType: keyword.toLowerCase(),
        sourceRange: { start: sourceStart, length: line.length },
    };
}

function parseSequenceMessage(line: string, sourceStart: number): ParsedSequenceMessage {
    const parsed = parseBinaryStatement(line, ["-->>", "->>", "-->", "->", "--x", "-x", "--)", "-)"]);
    if (!parsed)
        return null;
    const separatorIndex = parsed.right.indexOf(":");
    if (separatorIndex < 0)
        return null;
    const to = parsed.right.substring(0, separatorIndex).trim();
    const label = parsed.right.substring(separatorIndex + 1).trim();
    if (!to || !isIdentifier(to))
        return null;

    return {
        from: parsed.left,
        to,
        label: unquoteLabel(label),
        messageType: getSequenceMessageType(parsed.operator),
        connector: parsed.operator,
        sourceRange: { start: sourceStart, length: line.length },
    };
}

function ensureSequenceParticipant(participants: Map<string, ParsedSequenceParticipant>, id: string) {
    if (!participants.has(id))
        participants.set(id, { id, label: id, participantType: "participant", implicit: true });
}

function getSequenceMessageType(connector: string) {
    if (connector.includes(")"))
        return "async";
    if (connector.includes("--"))
        return "dotted";
    if (connector.includes("x"))
        return "cross";
    if (connector === "->")
        return "open";
    return "solid";
}

class SourceCursor {
    public position = 0;

    constructor(private readonly text: string) {
    }

    atEnd() {
        return this.position >= this.text.length;
    }

    skipWhitespace() {
        while (!this.atEnd() && isWhitespace(this.text[this.position]))
            this.position++;
    }

    skipRequiredWhitespace() {
        const start = this.position;
        this.skipWhitespace();
        return this.position > start;
    }

    readIdentifier() {
        if (this.atEnd() || !isIdentifierStart(this.text[this.position]))
            return "";
        const start = this.position;
        this.position++;
        while (!this.atEnd() && isIdentifierPart(this.text[this.position]))
            this.position++;
        return this.text.substring(start, this.position);
    }

    readRest() {
        const rest = this.text.substring(this.position);
        this.position = this.text.length;
        return rest;
    }

    consume(value: string) {
        if (!this.text.startsWith(value, this.position))
            return false;
        this.position += value.length;
        return true;
    }
}

function parseFlowchartDirection(line: string): FlowchartDirection | null {
    const cursor = new SourceCursor(line);
    const keyword = cursor.readIdentifier();
    if (!equalsIgnoreCase(keyword, "graph") && !equalsIgnoreCase(keyword, "flowchart"))
        return null;
    if (!cursor.skipRequiredWhitespace())
        return null;
    const direction = cursor.readIdentifier().toUpperCase();
    return isFlowchartDirection(direction) ? direction : null;
}

function parseDirectionStatement(line: string): FlowchartDirection | null {
    const cursor = new SourceCursor(line);
    const keyword = cursor.readIdentifier();
    if (!equalsIgnoreCase(keyword, "direction"))
        return null;
    if (!cursor.skipRequiredWhitespace())
        return null;
    const direction = cursor.readIdentifier().toUpperCase();
    return isRequirementDirection(direction) ? direction : null;
}

function parseSubgraphStart(line: string, sourceStart: number, parentId?: string): ParsedSubgraph | null {
    const cursor = new SourceCursor(line);
    const keyword = cursor.readIdentifier();
    if (!equalsIgnoreCase(keyword, "subgraph"))
        return null;
    if (!cursor.skipRequiredWhitespace())
        return null;
    const rest = cursor.readRest().trim();
    if (!rest)
        return null;
    const bracketStart = rest.indexOf("[");
    const bracketEnd = rest.endsWith("]") ? rest.length - 1 : -1;
    if (bracketStart > 0 && bracketEnd > bracketStart) {
        const id = rest.substring(0, bracketStart).trim();
        const title = unquoteLabel(rest.substring(bracketStart + 1, bracketEnd).trim());
        return { id, title, parentId, sourceRange: { start: sourceStart, length: line.length } };
    }
    const title = unquoteLabel(rest);
    return { id: sanitizeDirectiveId(title), title, parentId, sourceRange: { start: sourceStart, length: line.length } };
}

function parseFlowchartDirective(line: string, sourceStart: number): ParsedFlowchartDirective | null {
    const cursor = new SourceCursor(line);
    const keyword = cursor.readIdentifier();
    if (!keyword)
        return null;
    if (equalsIgnoreCase(keyword, "style") || equalsIgnoreCase(keyword, "classDef") || equalsIgnoreCase(keyword, "class") || equalsIgnoreCase(keyword, "click") || equalsIgnoreCase(keyword, "linkStyle"))
        return { line, sourceRange: { start: sourceStart, length: line.length } };
    if (line.includes("@{") && !line.trim().startsWith("subgraph"))
        return null;
    return null;
}

function parseBinaryStatement(line: string, operators: string[]) {
    const parsed = findOperator(line, operators);
    if (!parsed)
        return null;

    const leftRange = trimRange(line, 0, parsed.index);
    const rightRange = trimRange(line, parsed.index + parsed.operator.length, line.length);
    if (leftRange.start >= leftRange.end || rightRange.start >= rightRange.end)
        return null;

    return {
        left: line.substring(leftRange.start, leftRange.end),
        leftStart: leftRange.start,
        operator: parsed.operator,
        operatorStart: parsed.index,
        right: line.substring(rightRange.start, rightRange.end),
        rightStart: rightRange.start,
    };
}

function parseRequirementBlockStart(line: string): { kind: "requirement" | "element"; type: string; id: string } | null {
    const cursor = new SourceCursor(line);
    const type = cursor.readIdentifier();
    if (!type)
        return null;
    const kind = equalsIgnoreCase(type, "element") ? "element" : isRequirementType(type) ? "requirement" : null;
    if (!kind)
        return null;
    if (!cursor.skipRequiredWhitespace())
        return null;
    const id = cursor.readIdentifier();
    if (!id)
        return null;
    cursor.skipWhitespace();
    if (cursor.consume(":::")) {
        cursor.readIdentifier();
        cursor.skipWhitespace();
    }
    if (!cursor.consume("{"))
        return null;
    return { kind, type, id };
}

function parseRequirementBlock(blockStart: { kind: "requirement" | "element"; type: string; id: string }, lines: LineRecord[], sourceStart: number, sourceLength: number): ParsedRequirementNode {
    const values = new Map<string, string>();
    for (const line of lines) {
        const separator = findTopLevelColon(line.trimmed);
        if (separator < 0)
            continue;
        const key = line.trimmed.substring(0, separator).trim().toLowerCase();
        const value = unquoteLabel(line.trimmed.substring(separator + 1).trim());
        values.set(key, value);
    }

    if (blockStart.kind === "element") {
        return {
            id: blockStart.id,
            kind: "element",
            elementType: values.get("type") ?? "",
            docRef: values.get("docref") ?? "",
            sourceRange: { start: sourceStart, length: sourceLength },
        };
    }

    return {
        id: blockStart.id,
        kind: "requirement",
        requirementType: blockStart.type,
        requirementId: values.get("id") ?? "",
        text: values.get("text") ?? "",
        risk: values.get("risk") ?? "",
        verifyMethod: values.get("verifymethod") ?? values.get("verifymethod") ?? "",
        sourceRange: { start: sourceStart, length: sourceLength },
    };
}

function parseRequirementRelationship(line: string, sourceStart: number): ParsedRequirementRelationship | null {
    const forward = parseRequirementRelationshipForward(line, sourceStart);
    if (forward)
        return forward;
    return parseRequirementRelationshipReverse(line, sourceStart);
}

function parseRequirementRelationshipForward(line: string, sourceStart: number): ParsedRequirementRelationship | null {
    const cursor = new SourceCursor(line);
    const from = cursor.readIdentifier();
    if (!from)
        return null;
    cursor.skipWhitespace();
    if (!cursor.consume("-"))
        return null;
    cursor.skipWhitespace();
    const relationshipType = cursor.readIdentifier();
    if (!isRequirementRelationshipType(relationshipType))
        return null;
    cursor.skipWhitespace();
    if (!cursor.consume("->"))
        return null;
    cursor.skipWhitespace();
    const to = cursor.readIdentifier();
    if (!to)
        return null;
    return { from, to, relationshipType, syntaxDirection: "forward", sourceRange: { start: sourceStart, length: line.length } };
}

function parseRequirementRelationshipReverse(line: string, sourceStart: number): ParsedRequirementRelationship | null {
    const cursor = new SourceCursor(line);
    const to = cursor.readIdentifier();
    if (!to)
        return null;
    cursor.skipWhitespace();
    if (!cursor.consume("<-"))
        return null;
    cursor.skipWhitespace();
    const relationshipType = cursor.readIdentifier();
    if (!isRequirementRelationshipType(relationshipType))
        return null;
    cursor.skipWhitespace();
    if (!cursor.consume("-"))
        return null;
    cursor.skipWhitespace();
    const from = cursor.readIdentifier();
    if (!from)
        return null;
    return { from, to, relationshipType, syntaxDirection: "reverse", sourceRange: { start: sourceStart, length: line.length } };
}

function parseFlowchartEdgeStatement(line: string) {
    const parsed = parseBinaryStatement(line, getFlowchartOperators());
    if (!parsed)
        return null;

    let left = parsed.left;
    let leftStart = parsed.leftStart;
    let edgeId = "";
    const edgeIdSeparator = left.lastIndexOf("@");
    if (edgeIdSeparator > 0) {
        const candidate = left.substring(edgeIdSeparator + 1).trim();
        if (!candidate) {
            const idRange = trimRange(left, 0, edgeIdSeparator);
            const idCandidate = left.substring(idRange.start, idRange.end).split(" ").pop();
            if (isIdentifier(idCandidate)) {
                edgeId = idCandidate;
                left = left.substring(0, left.lastIndexOf(idCandidate)).trim();
                leftStart = parsed.leftStart;
            }
        }
    }

    let label = "";
    let labelPartLength = 0;
    const right = parsed.right;
    if (right[0] === "|") {
        const end = right.indexOf("|", 1);
        if (end > 0) {
            label = right.substring(1, end);
            const afterLabel = right.substring(end + 1).trim();
            const skipped = countLeadingWhitespace(right);
            labelPartLength = skipped + end + 1;
            const afterLabelWhitespace = countLeadingWhitespace(right.substring(end + 1));
            return {
                ...parsed,
                left,
                leftStart,
                right: afterLabel,
                rightStart: parsed.rightStart + skipped + end + 1 + afterLabelWhitespace,
                label,
                labelPartLength,
                edgeId,
            };
        }
    }

    return { ...parsed, left, leftStart, label, labelPartLength, edgeId };
}

function getFlowchartOperators() {
    return [
        "<-->", "<==>", "<-.->",
        "--o", "--x", "o--o", "x--x", "o-->", "x-->",
        "~~~",
        "-...->", "-..->", "-.->", "-...-", "-..-", "-.-",
        "====>", "===>", "==>", "====", "===",
        "---->", "--->", "-->", "-----", "----", "---",
    ];
}

function parseExpandedShape(value: string): { shape: string; label?: string } | null {
    const cursor = new SourceCursor(value);
    if (!cursor.consume("@{"))
        return null;
    const contentEnd = value.lastIndexOf("}");
    const content = contentEnd >= 0 ? value.substring(cursor.position, contentEnd) : value.substring(cursor.position);
    const properties = parseObjectLiteralProperties(content);
    const shape = properties.get("shape");
    if (!shape)
        return null;
    return { shape, label: properties.get("label") };
}

function parseDelimitedShapeValue(value: string): { label: string; shape: string } | null {
    const candidates: Array<{ start: string; end: string; shape: string }> = [
        { start: "(((", end: ")))", shape: "doubleCircle" },
        { start: "((", end: "))", shape: "circle" },
        { start: "([", end: "])", shape: "stadium" },
        { start: "(", end: ")", shape: "round" },
        { start: "[[", end: "]]", shape: "subroutine" },
        { start: "[(", end: ")]", shape: "cylinder" },
        { start: ">", end: "]", shape: "asymmetric" },
        { start: "{{", end: "}}", shape: "hexagon" },
        { start: "{", end: "}", shape: "decision" },
        { start: "[/", end: "/]", shape: "parallelogram" },
        { start: "[\\", end: "\\]", shape: "parallelogramAlt" },
        { start: "[/", end: "\\]", shape: "trapezoid" },
        { start: "[\\", end: "/]", shape: "trapezoidAlt" },
        { start: "[", end: "]", shape: "rectangle" },
    ];

    for (const candidate of candidates) {
        if (value.startsWith(candidate.start) && value.endsWith(candidate.end)) {
            return {
                label: value.substring(candidate.start.length, value.length - candidate.end.length).trim(),
                shape: candidate.shape,
            };
        }
    }

    return null;
}

function parseObjectLiteralProperties(content: string) {
    const properties = new Map<string, string>();
    let start = 0;
    let quote = "";
    for (let i = 0; i <= content.length; i++) {
        const char = content[i];
        if (quote) {
            if (char === quote)
                quote = "";
            continue;
        }
        if (char === "\"" || char === "'") {
            quote = char;
            continue;
        }
        if (i === content.length || char === ",") {
            const part = content.substring(start, i).trim();
            const separator = findTopLevelColon(part);
            if (separator > 0) {
                const key = part.substring(0, separator).trim();
                const value = unquoteLabel(part.substring(separator + 1).trim());
                properties.set(key, value);
            }
            start = i + 1;
        }
    }
    return properties;
}

function findOperator(line: string, operators: string[]) {
    let depth = 0;
    let quote = "";
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (quote) {
            if (char === quote)
                quote = "";
            continue;
        }
        if (char === "\"" || char === "'") {
            quote = char;
            continue;
        }
        if (char === "[" || char === "(" || char === "{")
            depth++;
        else if (char === "]" || char === ")" || char === "}")
            depth = Math.max(0, depth - 1);
        if (depth > 0)
            continue;
        for (const operator of operators) {
            if (line.startsWith(operator, i))
                return { index: i, operator };
        }
    }
    return null;
}

function trimRange(text: string, start: number, end: number) {
    while (start < end && isWhitespace(text[start]))
        start++;
    while (end > start && isWhitespace(text[end - 1]))
        end--;
    return { start, end };
}

function countLeadingWhitespace(text: string) {
    let count = 0;
    while (count < text.length && isWhitespace(text[count]))
        count++;
    return count;
}

function equalsIgnoreCase(a: string, b: string) {
    return a.toLowerCase() === b.toLowerCase();
}

function isIdentifier(value: string) {
    const cursor = new SourceCursor(value);
    const id = cursor.readIdentifier();
    cursor.skipWhitespace();
    return id.length === value.length || (id.length > 0 && cursor.atEnd());
}

function isIdentifierStart(char: string) {
    return isAsciiLetter(char) || char === "_";
}

function isIdentifierPart(char: string) {
    return isIdentifierStart(char) || isAsciiDigit(char) || char === "-";
}

function isAsciiLetter(char: string) {
    if (!char)
        return false;
    const code = char.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAsciiDigit(char: string) {
    if (!char)
        return false;
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57;
}

function isWhitespace(char: string) {
    return char === " " || char === "\t" || char === "\r" || char === "\n";
}

async function getMermaidFlowchartData(code: string): Promise<{ nodes: ParsedNode[]; edges: ParsedEdge[] } | null> {
    try {
        const mermaid = await import("mermaid");
        mermaid.default.initialize({ startOnLoad: false, securityLevel: "loose" });
        const diagram = await mermaid.default.mermaidAPI.getDiagramFromText(code);
        const db = diagram.db as any;
        const vertices = db?.getVertices?.();
        const mermaidEdges = db?.getEdges?.();
        if (!vertices || !mermaidEdges)
            return null;

        const nodes: ParsedNode[] = Array.from(vertices.values()).map((vertex: any) => ({
            id: vertex.id,
            label: normalizeMermaidText(vertex.text ?? vertex.label ?? vertex.id),
            shape: mapMermaidVertexType(vertex.type),
        }));
        const edges: ParsedEdge[] = mermaidEdges.map((edge: any) => ({
            from: edge.start,
            to: edge.end,
            label: normalizeMermaidText(edge.text ?? ""),
            edgeType: mapMermaidEdgeType(edge),
        }));

        return { nodes, edges };
    } catch {
        return null;
    }
}

async function getMermaidSequenceData(code: string): Promise<{ participants: ParsedSequenceParticipant[]; messages: ParsedSequenceMessage[] } | null> {
    try {
        const mermaid = await import("mermaid");
        mermaid.default.initialize({ startOnLoad: false, securityLevel: "loose" });
        const diagram = await mermaid.default.mermaidAPI.getDiagramFromText(code);
        const db = diagram.db as any;
        const actors = db?.getActors?.();
        const mermaidMessages = db?.getMessages?.();
        if (!actors || !mermaidMessages)
            return null;

        const participants: ParsedSequenceParticipant[] = Array.from(actors.entries()).map(([id, actor]: [string, any]) => ({
            id,
            label: actor.description ?? actor.name ?? id,
            participantType: actor.type ?? "participant",
        }));
        const messages: ParsedSequenceMessage[] = mermaidMessages
            .filter((message: any) => typeof message.from === "string" && typeof message.to === "string")
            .map((message: any) => {
                const connector = mapMermaidSequenceConnector(message.type);
                return {
                    from: message.from,
                    to: message.to,
                    label: message.message ?? "",
                    messageType: getSequenceMessageType(connector),
                    connector,
                };
            });

        return { participants, messages };
    } catch {
        return null;
    }
}

function getScannedEdge(scannedEdges: ParsedEdge[], edge: ParsedEdge): Partial<ParsedEdge> {
    return scannedEdges.find(scannedEdge => scannedEdge.from === edge.from && scannedEdge.to === edge.to && scannedEdge.label === edge.label) ?? {};
}

function mapMermaidVertexType(type: string) {
    const expanded = mapExpandedShape(type);
    if (expanded !== "rectangle")
        return expanded;
    switch (type) {
        case "diamond":
            return "decision";
        case "round":
            return "round";
        case "stadium":
            return "stadium";
        case "circle":
            return "circle";
        case "doublecircle":
            return "doubleCircle";
        case "subroutine":
            return "subroutine";
        case "cylinder":
            return "cylinder";
        case "odd":
            return "asymmetric";
        case "hexagon":
            return "hexagon";
        case "lean_right":
            return "parallelogram";
        case "lean_left":
            return "parallelogramAlt";
        case "trapezoid":
            return "trapezoid";
        case "inv_trapezoid":
            return "trapezoidAlt";
        default:
            return "rectangle";
    }
}

function mapMermaidEdgeType(edge: any) {
    if (edge.stroke === "dotted")
        return "dotted";
    if (edge.stroke === "thick")
        return "thick";
    if (!edge.type?.includes("arrow"))
        return "open";
    return "arrow";
}

function mapMermaidSequenceConnector(type: number) {
    switch (type) {
        case 1:
            return "-->>";
        case 3:
            return "-x";
        case 4:
            return "--x";
        case 5:
            return "->";
        case 6:
            return "-->";
        case 24:
            return "-)";
        case 25:
            return "--)";
        default:
            return "->>";
    }
}

function normalizeMermaidText(value: any) {
    if (value == null)
        return "";
    if (typeof value === "string")
        return stripMarkdownString(value);
    if (Array.isArray(value))
        return value.map(normalizeMermaidText).join("\n");
    if (typeof value === "object") {
        if (typeof value.text === "string")
            return stripMarkdownString(value.text);
        if (typeof value.label === "string")
            return stripMarkdownString(value.label);
        if (typeof value.markdown === "string")
            return stripMarkdownString(value.markdown);
    }
    return stripMarkdownString(value.toString());
}

function stripMarkdownString(value: string) {
    let result = value;
    if (result.startsWith("`") && result.endsWith("`") && result.length >= 2)
        result = result.substring(1, result.length - 1);
    return normalizeLabelLineBreaks(result);
}

function mergeNode(nodes: Map<string, ParsedNode>, node: ParsedNode) {
    const existing = nodes.get(node.id);
    if (!existing || existing.label === existing.id || node.label !== node.id)
        nodes.set(node.id, node);
}

function parseNode(line: string, sourceStart?: number): ParsedNode {
    const cursor = new SourceCursor(line);
    const id = cursor.readIdentifier();
    if (!id)
        return null;

    cursor.skipWhitespace();
    const value = cursor.readRest().trim();
    const parsedShape = parseShapeValue(id, value);
    if (!parsedShape)
        return null;

    return {
        ...parsedShape,
        sourceRange: sourceStart == null ? undefined : { start: sourceStart, length: line.length },
    };
}

function parseMindmapNode(line: string, index: number, parentId: string, sourceStart: number, sourceLength: number, indent: number): ParsedMindmapNode {
    const parsedNode = parseNode(line);
    if (parsedNode) {
        return {
            id: parsedNode.id,
            parentId,
            label: parsedNode.label,
            shape: mapMindmapShape(parsedNode.shape),
            indent,
            sourceRange: { start: sourceStart, length: sourceLength },
        };
    }

    const id = sanitizeMindmapId(line, index);
    return {
        id,
        parentId,
        label: unquoteLabel(line),
        shape: "default",
        indent,
        sourceRange: { start: sourceStart, length: sourceLength },
    };
}

function parseEdge(line: string, sourceStart: number): ParsedEdge & { fromNode: ParsedNode; toNode: ParsedNode } {
    const parsed = parseFlowchartEdgeStatement(line);
    if (!parsed)
        return null;

    const fromNode = parseNodeToken(parsed.left);
    const toNode = parseNodeToken(parsed.right);
    if (!fromNode || !toNode)
        return null;

    fromNode.sourceRange = { start: sourceStart + parsed.leftStart + parsed.left.indexOf(fromNode.id), length: fromNode.id.length };
    toNode.sourceRange = { start: sourceStart + parsed.rightStart + parsed.right.indexOf(toNode.id), length: toNode.id.length };

    return {
        from: fromNode.id,
        to: toNode.id,
        fromNode,
        toNode,
        label: parsed.label,
        edgeType: getEdgeType(parsed.operator),
        connector: parsed.operator,
        edgeId: parsed.edgeId,
        connectorRange: { start: sourceStart + parsed.operatorStart, length: parsed.operator.length + parsed.labelPartLength },
        sourceRange: { start: sourceStart, length: line.length },
    };
}

function parseNodeToken(token: string): ParsedNode {
    const node = parseNode(token);
    if (node)
        return node;

    const id = new SourceCursor(token).readIdentifier();
    return id ? { id, label: id, shape: "rectangle" } : null;
}

function parseShapeValue(id: string, value: string): ParsedNode {
    if (!value)
        return { id, label: id, shape: "rectangle" };

    const expandedShape = parseExpandedShape(value);
    if (expandedShape)
        return { id, label: expandedShape.label ?? id, shape: mapExpandedShape(expandedShape.shape) };

    const shapeValue = parseDelimitedShapeValue(value);
    if (shapeValue)
        return { id, label: unquoteLabel(shapeValue.label), shape: shapeValue.shape };

    return null;
}

function getEdgeType(connector: string) {
    if (connector.includes("~"))
        return "invisible";
    if (connector.includes("o"))
        return "circle";
    if (connector.includes("x"))
        return "cross";
    if (connector.startsWith("<") && connector.endsWith(">"))
        return "multi";
    if (connector.includes("=="))
        return "thick";
    if (connector.includes("-."))
        return "dotted";
    if (!connector.includes(">"))
        return "open";
    return "arrow";
}

function unquoteLabel(label: string) {
    let result = label.trim();
    if (result.length >= 2) {
        const first = result[0];
        const last = result[result.length - 1];
        if ((first === "\"" && last === "\"") || (first === "'" && last === "'"))
            result = result.substring(1, result.length - 1);
    }
    return normalizeLabelLineBreaks(result);
}

function mapExpandedShape(shape: string) {
    switch (shape) {
        case "rect":
        case "proc":
        case "process":
        case "rectangle":
            return "rectangle";
        case "bang":
            return "bang";
        case "notch-rect":
        case "card":
        case "notched-rectangle":
            return "notch-rect";
        case "cloud":
            return "cloud";
        case "hourglass":
        case "collate":
            return "hourglass";
        case "bolt":
        case "com-link":
        case "lightning-bolt":
            return "bolt";
        case "brace":
        case "brace-l":
        case "comment":
            return "brace";
        case "brace-r":
            return "brace-r";
        case "braces":
            return "braces";
        case "datastore":
        case "data-store":
            return "datastore";
        case "delay":
        case "half-rounded-rectangle":
            return "delay";
        case "h-cyl":
        case "das":
        case "horizontal-cylinder":
            return "h-cyl";
        case "lin-cyl":
        case "disk":
        case "lined-cylinder":
            return "lin-cyl";
        case "curv-trap":
        case "curved-trapezoid":
        case "display":
            return "curv-trap";
        case "div-rect":
        case "div-proc":
        case "divided-process":
        case "divided-rectangle":
            return "div-rect";
        case "doc":
        case "document":
            return "doc";
        case "tri":
        case "extract":
        case "triangle":
            return "tri";
        case "fork":
        case "join":
            return "fork";
        case "win-pane":
        case "internal-storage":
        case "window-pane":
            return "win-pane";
        case "f-circ":
        case "filled-circle":
        case "junction":
            return "f-circ";
        case "lin-doc":
        case "lined-document":
            return "lin-doc";
        case "lin-rect":
        case "lin-proc":
        case "lined-process":
        case "lined-rectangle":
        case "shaded-process":
            return "lin-rect";
        case "notch-pent":
        case "loop-limit":
        case "notched-pentagon":
            return "notch-pent";
        case "flip-tri":
        case "flipped-triangle":
        case "manual-file":
            return "flip-tri";
        case "sl-rect":
        case "manual-input":
        case "sloped-rectangle":
            return "sl-rect";
        case "docs":
        case "documents":
        case "st-doc":
        case "stacked-document":
            return "docs";
        case "st-rect":
        case "processes":
        case "procs":
        case "stacked-rectangle":
            return "st-rect";
        case "odd":
            return "asymmetric";
        case "flag":
        case "paper-tape":
            return "flag";
        case "bow-rect":
        case "bow-tie-rectangle":
        case "stored-data":
            return "bow-rect";
        case "fr-circ":
        case "framed-circle":
        case "stop":
            return "fr-circ";
        case "cross-circ":
        case "crossed-circle":
        case "summary":
            return "cross-circ";
        case "tag-doc":
        case "tagged-document":
            return "tag-doc";
        case "tag-rect":
        case "tag-proc":
        case "tagged-process":
        case "tagged-rectangle":
            return "tag-rect";
        case "text":
            return "text";
        case "diam":
        case "diamond":
        case "decision":
        case "question":
            return "decision";
        case "rounded":
        case "round":
            return "round";
        case "stadium":
        case "terminal":
            return "stadium";
        case "subroutine":
        case "subprocess":
        case "subproc":
        case "fr-rect":
            return "subroutine";
        case "cyl":
        case "cylinder":
        case "database":
        case "db":
            return "cylinder";
        case "hex":
        case "hexagon":
            return "hexagon";
        case "circle":
            return "circle";
        case "dbl-circ":
        case "double-circle":
            return "doubleCircle";
        case "lean-r":
        case "in-out":
        case "lean-right":
            return "parallelogram";
        case "lean-l":
        case "lean-left":
        case "out-in":
            return "parallelogramAlt";
        case "trap-b":
        case "priority":
        case "trapezoid":
        case "trapezoid-bottom":
            return "trapezoid";
        case "trap-t":
        case "inv-trapezoid":
        case "manual":
        case "trapezoid-top":
            return "trapezoidAlt";
        default:
            return "rectangle";
    }
}

function mapMindmapShape(shape: string) {
    switch (shape) {
        case "rectangle":
            return "square";
        case "round":
        case "circle":
        case "hexagon":
            return shape;
        default:
            return "default";
    }
}

function sanitizeMindmapId(label: string, index: number) {
    let result = "";
    for (const char of label) {
        if (isIdentifierPart(char))
            result += char;
        else if (isWhitespace(char) && result && result[result.length - 1] !== "_")
            result += "_";
    }
    result = result.trim();
    return result || "mindmap_" + index;
}

function sanitizeDirectiveId(label: string) {
    let result = "";
    for (const char of label) {
        if (isIdentifierPart(char))
            result += char;
        else if (isWhitespace(char) && result && result[result.length - 1] !== "_")
            result += "_";
    }
    return result || "subgraph";
}

function getDefaultMindmapNodeSize(shape: string) {
    switch (shape) {
        case "circle":
        case "bang":
            return { width: 88, height: 88 };
        case "hexagon":
            return { width: 150, height: 58 };
        default:
            return { width: 150, height: 44 };
    }
}

function getDefaultRequirementNodeSize(node: ParsedRequirementNode) {
    if (node.kind === "element")
        return { width: 170, height: node.docRef ? 108 : 84 };
    return { width: 220, height: 160 };
}

function getDefaultNodeSize(shape: string) {
    switch (shape) {
        case "decision":
            return { width: 120, height: 80 };
        case "circle":
        case "doubleCircle":
        case "fr-circ":
        case "cross-circ":
        case "f-circ":
            return { width: 80, height: 80 };
        case "bang":
            return { width: 92, height: 92 };
        case "fork":
            return { width: 140, height: 28 };
        case "tri":
        case "flip-tri":
            return { width: 110, height: 90 };
        case "brace":
        case "brace-r":
        case "braces":
        case "text":
            return { width: 140, height: 54 };
        default:
            return { width: 120, height: 54 };
    }
}

function getFallbackRequirementNodePosition(index: number, total: number, direction: FlowchartDirection) {
    const columns = direction === "LR" || direction === "RL" ? Math.max(1, Math.ceil(total / 3)) : 3;
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = 40 + column * 300;
    const top = 40 + row * 230;
    if (direction === "RL")
        return { left: 40 + (columns - column - 1) * 300, top };
    if (direction === "BT")
        return { left, top: 40 + (Math.ceil(total / columns) - row - 1) * 230 };
    return { left, top };
}

function getFallbackFlowchartNodePosition(index: number, count: number, direction: FlowchartDirection) {
    const xStep = 180;
    const yStep = 110;
    switch (direction) {
        case "LR":
            return { left: 40 + index * xStep, top: 40 };
        case "RL":
            return { left: 40 + (count - index - 1) * xStep, top: 40 };
        case "BT":
            return { left: 40, top: 40 + (count - index - 1) * yStep };
        case "TD":
        case "TB":
        default:
            return { left: 40, top: 40 + index * yStep };
    }
}

function readMermaidDocument(text: string): ParsedMermaidDocument {
    const lines = getLineRecords(text);
    if (lines[0]?.trimmed !== "---")
        return { lines, title: "", frontmatter: "" };

    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trimmed === "---") {
            frontmatterEnd = i;
            break;
        }
    }

    if (frontmatterEnd < 0)
        return { lines, title: "", frontmatter: "" };

    const frontmatterLines = lines.slice(1, frontmatterEnd);

    return {
        lines: lines.filter((_, index) => index > frontmatterEnd),
        title: readFrontmatterTitle(frontmatterLines),
        frontmatter: readFrontmatterWithoutTitle(frontmatterLines),
    };
}

function readFrontmatterTitle(lines: LineRecord[]) {
    for (const line of lines) {
        const separator = line.trimmed.indexOf(":");
        if (separator < 0)
            continue;
        const key = line.trimmed.substring(0, separator).trim();
        if (equalsIgnoreCase(key, "title"))
            return unquoteLabel(line.trimmed.substring(separator + 1).trim());
    }
    return "";
}

function readFrontmatterWithoutTitle(lines: LineRecord[]) {
    const remainingLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const separator = line.trimmed.indexOf(":");
        const key = separator >= 0 ? line.trimmed.substring(0, separator).trim() : "";
        if (equalsIgnoreCase(key, "title"))
            continue;
        remainingLines.push(line.text);
    }
    return trimBlankLines(remainingLines).join("\n");
}

function trimBlankLines(lines: string[]) {
    let start = 0;
    let end = lines.length;
    while (start < end && !lines[start].trim())
        start++;
    while (end > start && !lines[end - 1].trim())
        end--;
    return lines.slice(start, end);
}

function getLineRecords(text: string) {
    const records: LineRecord[] = [];
    let offset = 0;
    for (const line of splitLines(text)) {
        const leadingWhitespaceLength = countLeadingWhitespace(line);
        records.push({ text: line, trimmed: line.trim(), indent: leadingWhitespaceLength, start: offset + leadingWhitespaceLength });
        offset += line.length + 1;
    }
    return records;
}

function splitLines(text: string) {
    const lines: string[] = [];
    let start = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") {
            let end = i;
            if (end > start && text[end - 1] === "\r")
                end--;
            lines.push(text.substring(start, end));
            start = i + 1;
        }
    }
    lines.push(text.substring(start));
    return lines;
}

function getDiagramDirection(designItems: IDesignItem[]) {
    const rootDesignItem = getRootDesignItem(designItems);
    const rootDirection = rootDesignItem?.getAttribute(mermaidFlowchartDirectionAttribute);
    if (isFlowchartDirection(rootDirection))
        return rootDirection;

    for (const designItem of designItems) {
        const direction = designItem.element.getAttribute("diagram-direction");
        if (isFlowchartDirection(direction))
            return direction;
    }
    return inferDiagramDirection(designItems);
}

function inferDiagramDirection(designItems: IDesignItem[]): FlowchartDirection {
    const nodes = designItems
        .filter(designItem => designItem.element.localName === "mermaid-node")
        .map(designItem => {
            const element = designItem.element as HTMLElement;
            return {
                left: Number.parseFloat(element.style.left || "0"),
                top: Number.parseFloat(element.style.top || "0"),
            };
        });

    if (nodes.length < 2)
        return "TD";

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const dx = last.left - first.left;
    const dy = last.top - first.top;

    if (Math.abs(dx) > Math.abs(dy))
        return dx >= 0 ? "LR" : "RL";

    return dy >= 0 ? "TD" : "BT";
}

function isFlowchartDirection(value: string): value is FlowchartDirection {
    return value === "TB" || value === "TD" || value === "BT" || value === "RL" || value === "LR";
}

function isRequirementDirection(value: string): value is FlowchartDirection {
    return value === "TB" || value === "BT" || value === "RL" || value === "LR";
}

function setMermaidDocumentAttributes(instanceServiceContainer: InstanceServiceContainer, diagramType: MermaidDocumentDiagramType, direction?: FlowchartDirection, title?: string, frontmatter?: string) {
    const rootDesignItem = instanceServiceContainer?.designerCanvas?.rootDesignItem;
    rootDesignItem?._withoutUndoSetAttribute(mermaidDiagramTypeAttribute, diagramType);
    if (direction)
        rootDesignItem?._withoutUndoSetAttribute(mermaidFlowchartDirectionAttribute, direction);
    else
        rootDesignItem?._withoutUndoRemoveAttribute(mermaidFlowchartDirectionAttribute);
    if (title)
        rootDesignItem?._withoutUndoSetAttribute(mermaidTitleAttribute, title);
    else
        rootDesignItem?._withoutUndoRemoveAttribute(mermaidTitleAttribute);
    if (frontmatter)
        rootDesignItem?._withoutUndoSetAttribute(mermaidFrontmatterAttribute, frontmatter);
    else
        rootDesignItem?._withoutUndoRemoveAttribute(mermaidFrontmatterAttribute);
}

function writeMermaidFrontmatter(textWriter: ITextWriter, designItems: IDesignItem[], rootDesignItem?: IDesignItem) {
    const root = rootDesignItem ?? getRootDesignItem(designItems);
    const title = getMermaidDocumentTitle(root);
    const frontmatter = getMermaidDocumentFrontmatter(root);
    if (!title && !frontmatter)
        return;
    textWriter.writeLine("---");
    if (title)
        textWriter.writeLine("title: " + title);
    if (frontmatter) {
        for (const line of splitLines(frontmatter))
            textWriter.writeLine(line);
    }
    textWriter.writeLine("---");
}

function getWritableDocumentDiagramType(designItems: IDesignItem[]): MermaidDocumentDiagramType {
    const hasSequenceItems = designItems.some(designItem => designItem.element.localName === MermaidSequenceParticipant.is || designItem.element.localName === MermaidSequenceMessage.is);
    const hasFlowchartItems = designItems.some(designItem => designItem.element.localName === MermaidNode.is || designItem.element.localName === MermaidEdge.is);
    const hasMindmapItems = designItems.some(designItem => designItem.element.localName === MermaidMindmapNode.is);
    const hasRequirementItems = designItems.some(designItem => designItem.element.localName === MermaidRequirementNode.is || designItem.element.localName === MermaidRequirementRelationship.is);
    const rootDesignItem = getRootDesignItem(designItems);
    const documentType = rootDesignItem ? getMermaidDocumentDiagramType(rootDesignItem) : null;

    if (documentType === "requirementDiagram" && !hasFlowchartItems && !hasSequenceItems && !hasMindmapItems)
        return "requirementDiagram";
    if (documentType === "mindmap" && !hasFlowchartItems && !hasSequenceItems && !hasRequirementItems)
        return "mindmap";
    if (documentType === "sequenceDiagram" && !hasFlowchartItems && !hasMindmapItems && !hasRequirementItems)
        return "sequenceDiagram";
    if (documentType === "flowchart" && !hasSequenceItems && !hasMindmapItems && !hasRequirementItems)
        return "flowchart";
    if (hasRequirementItems)
        return "requirementDiagram";
    if (hasMindmapItems)
        return "mindmap";
    if (hasSequenceItems)
        return "sequenceDiagram";
    return "flowchart";
}

function getRootDesignItem(designItems: IDesignItem[]) {
    return designItems[0]?.isRootItem ? designItems[0] : designItems[0]?.instanceServiceContainer?.designerCanvas?.rootDesignItem;
}

function getMermaidDesignItems(designItems: IDesignItem[]) {
    if (designItems[0]?.isRootItem)
        return Array.from(designItems[0].children());
    return designItems;
}

function getMindmapSortValue(designItem: IDesignItem) {
    const element = designItem.element as HTMLElement;
    const top = Number.parseFloat(element.style.top || "0");
    const left = Number.parseFloat(element.style.left || "0");
    return top * 10000 + left;
}

function sortMindmapItems(items: IDesignItem[]) {
    return [...items].sort((a, b) => getMindmapSortValue(a) - getMindmapSortValue(b));
}

function repeatText(value: string, count: number) {
    let result = "";
    for (let i = 0; i < count; i++)
        result += value;
    return result;
}

function writeDesignItemLine(textWriter: ITextWriter, designItem: IDesignItem, line: string, updatePositions?: boolean) {
    const start = textWriter.position;
    line = indentEmbeddedNewlines(line);
    textWriter.writeLine(line);
    if (updatePositions)
        designItem.instanceServiceContainer.designItemDocumentPositionService?.setPosition(designItem, { start, length: line.length });
}

function indentEmbeddedNewlines(line: string) {
    const newlineIndex = line.indexOf("\n");
    if (newlineIndex < 0)
        return line;
    const indent = line.substring(0, countLeadingWhitespace(line));
    return line.replaceAll("\n", "\n" + indent);
}

async function getMermaidLayout(code: string, nodes: Map<string, ParsedNode>) {
    if (typeof document === "undefined" || typeof DOMParser === "undefined")
        return null;

    try {
        const mermaid = await import("mermaid");
        const id = "mermaid-layout-" + Math.random().toString(36).slice(2);
        mermaid.default.initialize({ startOnLoad: false, securityLevel: "strict" });
        const result = await mermaid.default.render(id, code);
        const doc = new DOMParser().parseFromString(result.svg, "image/svg+xml");
        const layoutNodes = new Map<string, { x: number; y: number; width: number; height: number }>();
        const layoutSubgraphs = new Map<string, { x: number; y: number; width: number; height: number }>();
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;

        for (const nodeElement of Array.from(doc.querySelectorAll("g.node"))) {
            const nodeId = nodeElement.getAttribute("data-id") ?? getFlowchartNodeIdFromDomId(nodeElement.id);
            if (!nodeId || !nodes.has(nodeId))
                continue;

            const center = parseTranslate(nodeElement.getAttribute("transform"));
            const size = getSvgNodeSize(nodeElement);
            const layout = {
                x: center.x - size.width / 2,
                y: center.y - size.height / 2,
                width: size.width,
                height: size.height,
            };
            layoutNodes.set(nodeId, layout);
            minX = Math.min(minX, layout.x);
            minY = Math.min(minY, layout.y);
        }

        for (const clusterElement of Array.from(doc.querySelectorAll("g.cluster"))) {
            const clusterId = getClusterIdFromDomId(clusterElement.id, id);
            if (!clusterId)
                continue;
            const rect = clusterElement.querySelector("rect");
            if (!rect)
                continue;
            const translate = parseTranslate(clusterElement.getAttribute("transform"));
            const x = (Number.parseFloat(rect.getAttribute("x") ?? "0") || 0) + translate.x;
            const y = (Number.parseFloat(rect.getAttribute("y") ?? "0") || 0) + translate.y;
            const width = Number.parseFloat(rect.getAttribute("width") ?? "");
            const height = Number.parseFloat(rect.getAttribute("height") ?? "");
            if (!Number.isFinite(width) || !Number.isFinite(height))
                continue;
            const layout = { x, y, width, height };
            layoutSubgraphs.set(clusterId, layout);
            minX = Math.min(minX, layout.x);
            minY = Math.min(minY, layout.y);
        }

        if (!layoutNodes.size && !layoutSubgraphs.size)
            return null;

        const offsetX = 40 - minX;
        const offsetY = 40 - minY;
        for (const layout of layoutNodes.values()) {
            layout.x += offsetX;
            layout.y += offsetY;
        }
        for (const layout of layoutSubgraphs.values()) {
            layout.x += offsetX;
            layout.y += offsetY;
        }

        return { nodes: layoutNodes, subgraphs: layoutSubgraphs };
    } catch {
        return null;
    }
}

async function getMermaidRequirementLayout(code: string, nodes: Map<string, ParsedRequirementNode>) {
    if (typeof document === "undefined" || typeof DOMParser === "undefined")
        return null;

    try {
        const mermaid = await import("mermaid");
        const id = "mermaid-requirement-layout-" + Math.random().toString(36).slice(2);
        mermaid.default.initialize({ startOnLoad: false, securityLevel: "strict" });
        const result = await mermaid.default.render(id, code);
        const doc = new DOMParser().parseFromString(result.svg, "image/svg+xml");
        const layoutNodes = new Map<string, { x: number; y: number; width: number; height: number }>();
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;

        for (const nodeElement of Array.from(doc.querySelectorAll("g.node"))) {
            const nodeId = getRequirementNodeIdFromSvgId(nodeElement.id, id, nodes);
            const node = nodeId ? nodes.get(nodeId) : null;
            if (!node)
                continue;
            const center = parseTranslate(nodeElement.getAttribute("transform"));
            const size = getDefaultRequirementNodeSize(node);
            const layout = {
                x: center.x - size.width / 2,
                y: center.y - size.height / 2,
                width: size.width,
                height: size.height,
            };
            layoutNodes.set(nodeId, layout);
            minX = Math.min(minX, layout.x);
            minY = Math.min(minY, layout.y);
        }

        if (!layoutNodes.size)
            return null;

        const offsetX = 40 - minX;
        const offsetY = 40 - minY;
        for (const layout of layoutNodes.values()) {
            layout.x += offsetX;
            layout.y += offsetY;
        }

        return { nodes: layoutNodes };
    } catch {
        return null;
    }
}

async function getMermaidMindmapLayout(code: string, nodes: ParsedMindmapNode[]) {
    if (typeof document === "undefined" || typeof DOMParser === "undefined")
        return null;

    try {
        const mermaid = await import("mermaid");
        const id = "mermaid-mindmap-layout-" + Math.random().toString(36).slice(2);
        mermaid.default.initialize({ startOnLoad: false, securityLevel: "strict" });
        const result = await mermaid.default.render(id, code);
        const doc = new DOMParser().parseFromString(result.svg, "image/svg+xml");
        const layoutNodes = new Map<string, { x: number; y: number; width: number; height: number }>();
        const candidateElements = Array.from(doc.querySelectorAll("g.node.mindmap-node"));
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let nextNodeIndex = 0;

        for (const nodeElement of candidateElements) {
            if (nextNodeIndex >= nodes.length)
                break;
            if (!nodeElement.querySelector("text, foreignObject"))
                continue;

            const node = nodes[nextNodeIndex++];
            const center = parseTranslateFromElementTree(nodeElement);
            const size = getMindmapWidgetSize(getSvgNodeSize(nodeElement), node.shape);
            const layout = {
                x: center.x - size.width / 2,
                y: center.y - size.height / 2,
                width: size.width,
                height: size.height,
            };
            layoutNodes.set(node.id, layout);
            minX = Math.min(minX, layout.x);
            minY = Math.min(minY, layout.y);
        }

        if (!layoutNodes.size)
            return null;

        const offsetX = 40 - minX;
        const offsetY = 40 - minY;
        for (const layout of layoutNodes.values()) {
            layout.x += offsetX;
            layout.y += offsetY;
        }

        return { nodes: layoutNodes };
    } catch {
        return null;
    }
}

function parseTranslateFromElementTree(element: Element) {
    let x = 0;
    let y = 0;
    let current: Element = element;
    while (current) {
        const translate = parseTranslate(current.getAttribute("transform"));
        x += translate.x;
        y += translate.y;
        current = current.parentElement;
    }
    return { x, y };
}

function parseTranslate(transform: string) {
    const values = parseTranslateValues(transform);
    return {
        x: values.x,
        y: values.y,
    };
}

function getFlowchartNodeIdFromDomId(domId: string) {
    const prefix = "flowchart-";
    if (!domId?.startsWith(prefix))
        return "";
    const withoutPrefix = domId.substring(prefix.length);
    const lastDash = withoutPrefix.lastIndexOf("-");
    if (lastDash < 0)
        return withoutPrefix;
    const suffix = withoutPrefix.substring(lastDash + 1);
    return isAllDigits(suffix) ? withoutPrefix.substring(0, lastDash) : withoutPrefix;
}

function getRequirementNodeIdFromSvgId(svgId: string, renderId: string, nodes: Map<string, ParsedRequirementNode>) {
    if (!svgId)
        return "";
    const prefix = renderId + "-";
    if (svgId.startsWith(prefix)) {
        const id = svgId.substring(prefix.length);
        if (nodes.has(id))
            return id;
    }
    let match = "";
    for (const id of nodes.keys()) {
        if (svgId.endsWith("-" + id) && id.length > match.length)
            match = id;
    }
    return match;
}

function getClusterIdFromDomId(domId: string, renderId: string) {
    if (!domId)
        return "";
    const prefixes = [renderId + "_flowchart-", "flowchart-", renderId + "-", "cluster-"];
    for (const prefix of prefixes) {
        if (domId.startsWith(prefix))
            return domId.substring(prefix.length);
    }
    return domId;
}

function parseTranslateValues(transform: string) {
    const result = { x: 0, y: 0 };
    if (!transform)
        return result;
    const name = "translate(";
    const start = transform.indexOf(name);
    if (start < 0)
        return result;
    const end = transform.indexOf(")", start + name.length);
    if (end < 0)
        return result;
    const content = transform.substring(start + name.length, end).trim();
    const separator = content.includes(",") ? content.indexOf(",") : content.indexOf(" ");
    if (separator < 0)
        return result;
    result.x = Number.parseFloat(content.substring(0, separator).trim()) || 0;
    result.y = Number.parseFloat(content.substring(separator + 1).trim()) || 0;
    return result;
}

function findTopLevelColon(text: string) {
    let quote = "";
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quote) {
            if (char === quote)
                quote = "";
            continue;
        }
        if (char === "\"" || char === "'") {
            quote = char;
            continue;
        }
        if (char === ":")
            return i;
    }
    return -1;
}

function isRequirementType(value: string) {
    return equalsIgnoreCase(value, "requirement")
        || equalsIgnoreCase(value, "functionalRequirement")
        || equalsIgnoreCase(value, "interfaceRequirement")
        || equalsIgnoreCase(value, "performanceRequirement")
        || equalsIgnoreCase(value, "physicalRequirement")
        || equalsIgnoreCase(value, "designConstraint");
}

function isRequirementRelationshipType(value: string) {
    return equalsIgnoreCase(value, "contains")
        || equalsIgnoreCase(value, "copies")
        || equalsIgnoreCase(value, "derives")
        || equalsIgnoreCase(value, "satisfies")
        || equalsIgnoreCase(value, "verifies")
        || equalsIgnoreCase(value, "refines")
        || equalsIgnoreCase(value, "traces");
}

function isAllDigits(value: string) {
    if (!value)
        return false;
    for (const char of value) {
        if (!isAsciiDigit(char))
            return false;
    }
    return true;
}

function getSvgNodeSize(nodeElement: Element) {
    const foreignObject = nodeElement.querySelector("foreignObject");
    if (foreignObject) {
        const width = Number.parseFloat(foreignObject.getAttribute("width") ?? "");
        const height = Number.parseFloat(foreignObject.getAttribute("height") ?? "");
        if (Number.isFinite(width) && Number.isFinite(height))
            return { width, height };
    }

    const rect = nodeElement.querySelector("rect");
    if (rect) {
        const width = Number.parseFloat(rect.getAttribute("width") ?? "");
        const height = Number.parseFloat(rect.getAttribute("height") ?? "");
        if (Number.isFinite(width) && Number.isFinite(height))
            return { width, height };
    }

    const polygon = nodeElement.querySelector("polygon");
    if (polygon) {
        const points = splitWhitespace(polygon.getAttribute("points") ?? "").map(point => {
            const [x, y] = point.split(",").map(Number);
            return { x, y };
        }).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
        if (points.length) {
            const xs = points.map(point => point.x);
            const ys = points.map(point => point.y);
            return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
        }
    }

    return { width: 120, height: 54 };
}

function getMindmapWidgetSize(svgSize: { width: number; height: number }, shape: string) {
    const defaultSize = getDefaultMindmapNodeSize(shape);
    return {
        width: Math.max(svgSize.width, defaultSize.width),
        height: Math.max(svgSize.height, defaultSize.height),
    };
}

function splitWhitespace(text: string) {
    const parts: string[] = [];
    let start = -1;
    for (let i = 0; i < text.length; i++) {
        if (isWhitespace(text[i])) {
            if (start >= 0) {
                parts.push(text.substring(start, i));
                start = -1;
            }
        } else if (start < 0) {
            start = i;
        }
    }
    if (start >= 0)
        parts.push(text.substring(start));
    return parts;
}
