import { ISelectionService } from './ISelectionService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from './ISelectionChangedEvent.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { SelectionChangedAction } from '../undoService/transactionItems/SelectionChangedAction.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';

export class SelectionService implements ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[] = [];
  _designerCanvas: IDesignerCanvas;
  _undoSelectionChanges: boolean;

  constructor(designerCanvas: IDesignerCanvas, undoSelectionChanges: boolean) {
    this._designerCanvas = designerCanvas;
    this._undoSelectionChanges = undoSelectionChanges;
  }

  setSelectedElements(designItems: IDesignItem[]) {
    if (this.selectedElements != designItems && !(this.selectedElements.length === 0 && (designItems == null || designItems.length === 0))) {
      if (this._undoSelectionChanges) {
        const action = new SelectionChangedAction(this.selectedElements, designItems, this);
        this._designerCanvas.instanceServiceContainer.undoService.execute(action);
      } else {
        this._withoutUndoSetSelectedElements(designItems);
      }
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