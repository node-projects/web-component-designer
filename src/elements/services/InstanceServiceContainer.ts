import { ISelectionService } from './selectionService/ISelectionService';
import { IUndoService } from './undoService/IUndoService';
import { BaseServiceContainer } from './BaseServiceContainer';
import { IContentService } from './contentService/IContentService';
import { DesignContext } from '../widgets/designerView/DesignContext';
import { IDesignContext } from '../widgets/designerView/IDesignContext';
import { IDesignerCanvas } from '../widgets/designerView/IDesignerCanvas.js';

interface InstanceServiceNameMap {
  "undoService": IUndoService;
  "selectionService": ISelectionService;
  "contentService": IContentService;
}

export class InstanceServiceContainer extends BaseServiceContainer<InstanceServiceNameMap> {
  public designContext: IDesignContext = new DesignContext();
  public readonly designerCanvas: IDesignerCanvas;

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
}