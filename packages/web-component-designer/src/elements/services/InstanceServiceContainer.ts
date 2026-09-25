import { ISelectionService } from './selectionService/ISelectionService.js';
import { IUndoService } from './undoService/IUndoService.js';
import { BaseServiceContainer } from './BaseServiceContainer.js';
import { DesignContext } from '../widgets/designerView/DesignContext.js';
import { IDesignContext } from '../widgets/designerView/IDesignContext.js';
import { IDesignerCanvas } from '../widgets/designerView/IDesignerCanvas.js';
import { IStylesheetService } from './stylesheetService/IStylesheetService.js';
import { IDesignItemDocumentPositionService } from './designItemDocumentPositionService/IDesignItemDocumentPositionService.js';
import { DocumentContainer } from '../documentContainer.js';
import { ICollaborationService } from './collaborationService/ICollaborationService.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import type { EditingDocument } from '../EditingDocument.js';
import { IDesignItem } from '../item/IDesignItem.js';

interface InstanceServiceNameMap {
  "undoService": IUndoService;
  "selectionService": ISelectionService;
  "stylesheetService": IStylesheetService;
  "designItemDocumentPositionService": IDesignItemDocumentPositionService;
}

interface IContentChangedParsed {
  changeType: 'parsed';
}

interface IContentChangedWithDesignItems {
  changeType: "added" | "removed" | "moved";
  designItems: IDesignItem[];
}

interface IContentChangedChangeWithDesignItems {
  changeType: "changed";
  designItems: IDesignItem[];
  type: "attribute" | "css" | "property";
  name: string;
  oldValue?: any;
  newValue?: any;
}

export type IContentChanged = IContentChangedParsed | IContentChangedWithDesignItems | IContentChangedChangeWithDesignItems ;

export class InstanceServiceContainer extends BaseServiceContainer<InstanceServiceNameMap> {
  public designContext: IDesignContext = new DesignContext();
  private _designerCanvas: IDesignerCanvas;
  readonly onDesignerCanvasChanged = new TypedEvent<{ oldCanvas: IDesignerCanvas, newCanvas: IDesignerCanvas }>();
  get designerCanvas() { return this._designerCanvas; }
  set designerCanvas(value: IDesignerCanvas) {
    if (value === this._designerCanvas) return;
    const oldCanvas = this._designerCanvas;
    this._designerCanvas = value;
    this.onDesignerCanvasChanged.emit({ oldCanvas, newCanvas: value });
  }
  public editingDocument?: EditingDocument;
  /** Internal attachment cleanup, including the owning view UI. */
  public detachView?: () => void;
  private _rootDesignItem: IDesignItem;
  public collaborationService?: ICollaborationService;

  public designer: any; //usable to assign designer from outside
  public documentContainer: DocumentContainer; //usable to assign designer from outside

  /** Event fired when the content of the designer changes, but raised from UndoService, so it should not be used to modify the elements again */
  public readonly onContentChanged = new TypedEvent<IContentChanged[]>();
  
  constructor(designerCanvas?: IDesignerCanvas) {
    super();
    this.designerCanvas = designerCanvas;
  }

  get rootDesignItem(): IDesignItem {
    return this._rootDesignItem ?? this.designerCanvas?.rootDesignItem;
  }

  set rootDesignItem(value: IDesignItem) {
    this._rootDesignItem = value;
  }

  /** Visual work is optional; document events must not depend on this. */
  refreshExtensions(items: IDesignItem[]) {
    if (this.designerCanvas?.isConnected)
      this.designerCanvas.extensionManager?.refreshAllExtensions(items);
  }

  get undoService(): IUndoService {
    return this.getLastService('undoService');
  }

  get selectionService(): ISelectionService {
    return this.getLastService('selectionService');
  }

  get stylesheetService(): IStylesheetService {
    return this.getLastService('stylesheetService');
  }

  get designItemDocumentPositionService(): IDesignItemDocumentPositionService {
    return this.getLastService('designItemDocumentPositionService');
  }
}