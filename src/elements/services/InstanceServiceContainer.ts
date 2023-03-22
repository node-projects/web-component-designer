import { ISelectionService } from './selectionService/ISelectionService.js';
import { IUndoService } from './undoService/IUndoService.js';
import { BaseServiceContainer } from './BaseServiceContainer.js';
import { IContentService } from './contentService/IContentService.js';
import { DesignContext } from '../widgets/designerView/DesignContext.js';
import { IDesignContext } from '../widgets/designerView/IDesignContext.js';
import { IDesignerCanvas } from '../widgets/designerView/IDesignerCanvas.js';
import { IStylesheetService } from './stylesheetService/IStylesheetService.js';
import { IDesignItemDocumentPositionService } from './designItemDocumentPositionService/IDesignItemDocumentPositionService.js';

interface InstanceServiceNameMap {
  "undoService": IUndoService;
  "selectionService": ISelectionService;
  "contentService": IContentService;
  "stylesheetService": IStylesheetService;
  "designItemDocumentPositionService": IDesignItemDocumentPositionService;
}

export class InstanceServiceContainer extends BaseServiceContainer<InstanceServiceNameMap> {
  public designContext: IDesignContext = new DesignContext();
  public readonly designerCanvas: IDesignerCanvas;

  public designer: any; //usable to assign designer from outside

  constructor(designerCanvas: IDesignerCanvas) {
    super();
    this.designerCanvas = designerCanvas;
  }

  get undoService(): IUndoService {
    return this.getLastService('undoService');
  }

  get selectionService(): ISelectionService {
    return this.getLastService('selectionService');
  }

  get contentService(): IContentService {
    return this.getLastService('contentService');
  }

  get stylesheetService(): IStylesheetService {
    return this.getLastService('stylesheetService');
  }

  get designItemDocumentPositionService(): IDesignItemDocumentPositionService {
    return this.getLastService('designItemDocumentPositionService');
  }
}