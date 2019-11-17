import { ISelectionService } from './selectionService/ISelectionService';
import { IUndoService } from './undoService/IUndoService';
import { BaseServiceContainer } from './BaseServiceContainer';

interface InstanceServiceNameMap {
    "undoService": IUndoService;
    "selectionService": ISelectionService;
}

export class InstanceServiceContainer extends BaseServiceContainer<InstanceServiceNameMap> {
    get undoService(): IUndoService {
        return this.getLastService('undoService');
    }

    get selectionService(): ISelectionService {
        return this.getLastService('selectionService');
    }
}