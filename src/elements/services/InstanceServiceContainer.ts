import { ISelectionService } from './selectionService/ISelectionService';
import { IUndoService } from './undoService/IUndoService';
import { BaseServiceContainer } from './BaseServiceContainer';
import { IContentService } from './contentService/IContentService';

interface InstanceServiceNameMap {
    "undoService": IUndoService;
    "selectionService": ISelectionService;
    "contentService": IContentService;
}

export class InstanceServiceContainer extends BaseServiceContainer<InstanceServiceNameMap> {
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