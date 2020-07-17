import { ISelectionService } from './ISelectionService';
import { IDesignItem } from '../../item/IDesignItem';
import { TypedEvent } from '../../../basic/TypedEvent';
import { ISelectionChangedEvent } from './ISelectionChangedEvent';

export class SelectionService implements ISelectionService {
    primarySelection: IDesignItem;
    selectedElements: IDesignItem[] = [];

    setSelectedElements(designItems: IDesignItem[]) {
        let oldSelectedElements = this.selectedElements;

        //f (oldSelectedElements && oldSelectedElements.length==2 && designItems!=null && designItems.length<2)
            //debugger;
        if (!designItems) {
            this.selectedElements = [];
            this.primarySelection = null
        } else {
            this.selectedElements = designItems;
            if (designItems && designItems.length > 0)
                this.primarySelection = designItems[0];
            else
                this.primarySelection = null;
        }
        this.onSelectionChanged.emit({ selectedElements: this.selectedElements, oldSelectedElements: oldSelectedElements });
    }

    readonly onSelectionChanged = new TypedEvent<ISelectionChangedEvent>();
}