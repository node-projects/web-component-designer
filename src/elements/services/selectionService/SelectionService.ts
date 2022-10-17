import { ISelectionService } from './ISelectionService';
import { IDesignItem } from '../../item/IDesignItem';
import { ISelectionChangedEvent } from './ISelectionChangedEvent';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export class SelectionService implements ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[] = [];

  setSelectedElements(designItems: IDesignItem[]) {
    let oldSelectedElements = this.selectedElements;
    if (!designItems) {
      this.selectedElements = [];
      this.primarySelection = null
    } else {
      let newSelection: IDesignItem[] = []
      for (let d of designItems) {
        if (d && d != d.instanceServiceContainer.contentService.rootDesignItem)
          newSelection.push(d)
      }
      this.selectedElements = newSelection;
      if (newSelection && newSelection.length > 0)
        this.primarySelection = newSelection[0];
      else
        this.primarySelection = null;
    }
    this.onSelectionChanged.emit({ selectedElements: this.selectedElements, oldSelectedElements: oldSelectedElements });
  }

  clearSelectedElements() {
    this.setSelectedElements([]);
  }

  isSelected(designItem: IDesignItem) {
    return this.selectedElements.indexOf(designItem) >= 0;
  }

  readonly onSelectionChanged = new TypedEvent<ISelectionChangedEvent>();
}