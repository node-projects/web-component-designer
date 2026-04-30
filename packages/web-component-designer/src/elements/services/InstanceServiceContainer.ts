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
  public readonly designerCanvas: IDesignerCanvas;
  public collaborationService?: ICollaborationService;

  public designer: any; //usable to assign designer from outside
  public documentContainer: DocumentContainer; //usable to assign designer from outside

  /** Event fired when the content of the designer changes, but raised from UndoService, so it should not be used to modify the elements again */
  public readonly onContentChanged = new TypedEvent<IContentChanged[]>();
  
  constructor(designerCanvas: IDesignerCanvas) {
    super();
    this.designerCanvas = designerCanvas;
  }

  get rootDesignItem(): IDesignItem {
    return this.designerCanvas.rootDesignItem;
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