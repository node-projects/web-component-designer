import { IElementDefinition, IElementsService, InstanceServiceContainer } from "@node-projects/web-component-designer";
import { LazyLoader, TypedEvent } from "@node-projects/base-custom-webcomponent";
import { getMermaidDocumentDiagramType, MermaidDocumentDiagramType } from "./MermaidDocumentPropertiesService.js";

type MermaidElementDefinition = IElementDefinition & {
    diagramTypes?: MermaidDocumentDiagramType[];
}

type MermaidElementsJson = {
    elements: Array<string | MermaidElementDefinition>;
}

export class MermaidElementsService implements IElementsService {
    readonly onElementsChanged = new TypedEvent<void>();

    private _allElements: MermaidElementDefinition[];
    private _instanceServiceContainer: InstanceServiceContainer;
    private _currentDiagramType: MermaidDocumentDiagramType = "flowchart";
    private _resolveStored: ((value: IElementDefinition[]) => void)[];
    private _rejectStored: ((errorCode: number) => void)[];

    constructor(private readonly _name: string, file: string | URL) {
        LazyLoader.LoadText(file.toString()).then(data => {
            const parsed = JSON.parse(data) as MermaidElementsJson;
            this._allElements = parsed.elements.map(element => typeof element === "string" ? { tag: element } : element);
            this._resolveWaiting();
        }).catch(error => this._rejectWaiting(error));
    }

    get name() {
        return this._name;
    }

    setInstanceServiceContainer(instanceServiceContainer: InstanceServiceContainer) {
        this._instanceServiceContainer = instanceServiceContainer;
        this._refreshCurrentDiagramType();
        instanceServiceContainer.onContentChanged.on(() => this._refreshCurrentDiagramType());
    }

    getElements(): Promise<IElementDefinition[]> {
        if (this._allElements)
            return Promise.resolve(this._filterElements());
        if (!this._resolveStored) {
            this._resolveStored = [];
            this._rejectStored = [];
        }
        return new Promise((resolve, reject) => {
            this._resolveStored.push(resolve);
            this._rejectStored.push(reject);
        });
    }

    private _filterElements() {
        return this._allElements.filter(element => !element.diagramTypes || element.diagramTypes.includes(this._currentDiagramType));
    }

    private _refreshCurrentDiagramType() {
        const nextDiagramType = getMermaidDocumentDiagramType(this._instanceServiceContainer?.rootDesignItem);
        if (nextDiagramType === this._currentDiagramType)
            return;
        this._currentDiagramType = nextDiagramType;
        this.onElementsChanged.emit();
    }

    private _resolveWaiting() {
        if (!this._resolveStored)
            return;
        const elements = this._filterElements();
        this._resolveStored.forEach(resolve => resolve(elements));
        this._resolveStored = null;
        this._rejectStored = null;
    }

    private _rejectWaiting(error: number) {
        if (!this._rejectStored)
            return;
        this._rejectStored.forEach(reject => reject(error));
        this._resolveStored = null;
        this._rejectStored = null;
    }
}
