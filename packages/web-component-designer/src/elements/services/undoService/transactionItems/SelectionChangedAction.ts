import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { ISelectionService } from '../../selectionService/ISelectionService.js';
import { SelectionService } from '../../selectionService/SelectionService.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class SelectionChangedAction implements ITransactionItem {

    constructor(oldSelection: IDesignItem[], newSelection: IDesignItem[], selectionService: ISelectionService) {
        this.title = "Change Selection";

        this.oldSelection = oldSelection;
        this.newSelection = newSelection;
        this.selectionService = selectionService;
    }

    title?: string;

    get affectedItems() {
        if (this.oldSelection && this.newSelection)
            return [...this.oldSelection, ...this.newSelection];
        if (this.oldSelection)
            return [...this.oldSelection];
        return [...this.newSelection];
    }

    undo(): IContentChanged[] | null {
        (<SelectionService>this.selectionService)._withoutUndoSetSelectedElements(this.oldSelection);
        return null;
    }

    do(): IContentChanged[] | null {
        (<SelectionService>this.selectionService)._withoutUndoSetSelectedElements(this.newSelection);
        return null;
    }

    public oldSelection: IDesignItem[];
    public newSelection: IDesignItem[];
    public selectionService: ISelectionService

    mergeWith(other: ITransactionItem) {
        return false
    }
}