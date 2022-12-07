import { ISelectionService } from './ISelectionService';
import { IDesignItem } from '../../item/IDesignItem';
import { ISelectionChangedEvent } from './ISelectionChangedEvent';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { SelectionChangedAction } from '../undoService/transactionItems/SelectionChangedAction';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas';

export class SelectionService implements ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[] = [];
  _designerCanvas: IDesignerCanvas

  constructor(designerCanvas: IDesignerCanvas) {
    this._designerCanvas = designerCanvas;
  }

  setSelectedElements(designItems: IDesignItem[]) {
    if (this.selectedElements != designItems) {
      const action = new SelectionChangedAction(this.selectedElements, designItems, this);
      this._designerCanvas.instanceServiceContainer.undoService.execute(action);
    }
  }

  _withoutUndoSetSelectedElements(designItems: IDesignItem[]) {
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