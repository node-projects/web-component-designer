import { ISelectionService } from './ISelectionService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from './ISelectionChangedEvent.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { SelectionChangedAction } from '../undoService/transactionItems/SelectionChangedAction.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { ISelectionRefreshEvent } from './ISelectionRefreshEvent.js';

function findDesignItem(designItem: IDesignItem, position: number): IDesignItem {
  let usedItem = null;
  if (designItem.hasChildren) {
    for (let d of designItem.children()) {
      const nodePosition = designItem.instanceServiceContainer.designItemDocumentPositionService.getPosition(d);
      if (nodePosition) {
        if (nodePosition.start <= position && nodePosition.start + nodePosition.length >= position)
          usedItem = d;
      }
    }
  }
  if (usedItem) {
    return findDesignItem(usedItem, position)
  }
  return designItem;
}

export class SelectionService implements ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[] = [];
  _designerCanvas: IDesignerCanvas;
  _undoSelectionChanges: boolean;

  constructor(designerCanvas: IDesignerCanvas, undoSelectionChanges: boolean) {
    this._designerCanvas = designerCanvas;
    this._undoSelectionChanges = undoSelectionChanges;
  }

  setSelectedElements(designItems: IDesignItem[], event?: Event) {
    if (designItems === null || designItems.length === 0)
      designItems = [this._designerCanvas.rootDesignItem];

    if (this.selectedElements != designItems && !(this.selectedElements.length === 0 && (designItems == null || designItems.length === 0))) {
      if (this.selectedElements?.length === 1 && designItems?.length === 1 && designItems[0] === this.selectedElements[0]) {
        this.onSelectionRefresh.emit({ selectedElements: this.selectedElements, event });
        return;
      }
      if (this._undoSelectionChanges) {
        const action = new SelectionChangedAction(this.selectedElements, designItems, this);
        this._designerCanvas.instanceServiceContainer.undoService.execute(action);
      } else {
        this._withoutUndoSetSelectedElements(designItems, event);
      }
    }
  }

  setSelectionByTextRange(positionStart: number, positionEnd: number) {
    const item = findDesignItem(this._designerCanvas.rootDesignItem, positionStart);
    if (item) {
      if (this.selectedElements.length != 1 || this.primarySelection != item)
        this.setSelectedElements([item]);
    }
  }

  _withoutUndoSetSelectedElements(designItems: IDesignItem[], event?: Event) {
    let oldSelectedElements = this.selectedElements;
    if (!designItems) {
      this.selectedElements = [];
      this.primarySelection = null
    } else {
      let newSelection: IDesignItem[] = []
      for (let d of designItems) {
        if (d && (designItems.length == 1 || d !== d.instanceServiceContainer.contentService.rootDesignItem))
          newSelection.push(d)
      }
      this.selectedElements = newSelection;
      if (newSelection && newSelection.length > 0)
        this.primarySelection = newSelection[0];
      else
        this.primarySelection = null;
    }
    this.onSelectionChanged.emit({ selectedElements: this.selectedElements, oldSelectedElements: oldSelectedElements, event });
  }

  clearSelectedElements() {
    this.setSelectedElements([]);
  }

  isSelected(designItem: IDesignItem) {
    return this.selectedElements.indexOf(designItem) >= 0;
  }

  readonly onSelectionChanged = new TypedEvent<ISelectionChangedEvent>();
  readonly onSelectionRefresh = new TypedEvent<ISelectionRefreshEvent>();
}