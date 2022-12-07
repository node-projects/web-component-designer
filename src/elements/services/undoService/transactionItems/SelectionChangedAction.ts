import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { ISelectionService } from '../../selectionService/ISelectionService';
import { SelectionService } from '../../selectionService/SelectionService';

export class SelectionChangedAction implements ITransactionItem {

    constructor(oldSelection: IDesignItem[], newSelection: IDesignItem[], selectionService: ISelectionService) {
        this.title = "Change Selection";

        this.oldSelection = oldSelection;
        this.newSelection = newSelection;
        this.selectionService = selectionService;
    }

    title?: string;

    get affectedItems() {
        return [...this.oldSelection, ...this.newSelection];
    }

    undo() {
        (<SelectionService>this.selectionService)._withoutUndoSetSelectedElements(this.oldSelection);
    }

    do() {
        (<SelectionService>this.selectionService)._withoutUndoSetSelectedElements(this.newSelection);
    }

    public oldSelection: IDesignItem[];
    public newSelection: IDesignItem[];
    public selectionService: ISelectionService

    mergeWith(other: ITransactionItem) {
        return false
    }
}