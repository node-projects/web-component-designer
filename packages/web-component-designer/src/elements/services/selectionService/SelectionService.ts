import { ISelectionService } from './ISelectionService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from './ISelectionChangedEvent.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { SelectionChangedAction } from '../undoService/transactionItems/SelectionChangedAction.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { ISelectionRefreshEvent } from './ISelectionRefreshEvent.js';
import { ISourcePart } from '../sourceMapService/ISourcePart.js';

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
  selectedPart: ISourcePart;
  _designerCanvas: IDesignerCanvas;
  _undoSelectionChanges: boolean;

  constructor(designerCanvas: IDesignerCanvas, undoSelectionChanges: boolean) {
    this._designerCanvas = designerCanvas;
    this._undoSelectionChanges = undoSelectionChanges;
  }

  setSelectedElements(designItems: IDesignItem[], event?: Event, selectedPart?: ISourcePart) {
    this._setSelectedElements(designItems, event, selectedPart);
  }

  private _setSelectedElements(designItems: IDesignItem[], event?: Event, selectedPart?: ISourcePart) {
    if (designItems === null || designItems.length === 0)
      designItems = [this._designerCanvas.rootDesignItem];

    if (this.selectedElements != designItems && !(this.selectedElements.length === 0 && (designItems == null || designItems.length === 0))) {
      if (this.selectedElements?.length === 1 && designItems?.length === 1 && designItems[0] === this.selectedElements[0]) {
        this._setSelectedPart(selectedPart);
        this.onSelectionRefresh.emit({ selectedElements: this.selectedElements, selectedPart: this.selectedPart, event });
        return;
      }
      if (this._undoSelectionChanges) {
        const action = new SelectionChangedAction(this.selectedElements, designItems, this);
        this._designerCanvas.instanceServiceContainer.undoService.execute(action);
      } else {
        this._withoutUndoSetSelectedElements(designItems, event, selectedPart);
      }
    }
  }

  setSelectedPart(sourcePart: ISourcePart, event?: Event): void {
    if (this._setSelectedPart(sourcePart))
      this.onSelectionRefresh.emit({ selectedElements: this.selectedElements, selectedPart: this.selectedPart, event });
  }

  private _setSelectedPart(sourcePart: ISourcePart): boolean {
    const oldSelectedPart = this.selectedPart;
    if (oldSelectedPart === sourcePart || (oldSelectedPart?.designItem === sourcePart?.designItem && oldSelectedPart?.key === sourcePart?.key))
      return false;

    this.selectedPart = sourcePart;
    return true;
  }

  setSelectionByTextRange(positionStart: number, positionEnd: number) {
    const sourcePart = this._designerCanvas.instanceServiceContainer.designItemDocumentPositionService?.getSourcePartAt(positionStart);
    const item = findDesignItem(this._designerCanvas.rootDesignItem, positionStart);
    if (item) {
      if (this.selectedElements.length != 1 || this.primarySelection != item)
        this._setSelectedElements([item], undefined, sourcePart);
      else
        this.setSelectedPart(sourcePart);
    }
  }

  _withoutUndoSetSelectedElements(designItems: IDesignItem[], event?: Event, selectedPart?: ISourcePart) {
    let oldSelectedElements = this.selectedElements;
    let oldSelectedPart = this.selectedPart;
    if (!designItems) {
      this.selectedElements = [];
      this.primarySelection = null
      this.selectedPart = null;
    } else {
      let newSelection: IDesignItem[] = []
      for (let d of designItems) {
        if (d && (designItems.length == 1 || d !== d.instanceServiceContainer.designerCanvas.rootDesignItem))
          newSelection.push(d)
      }
      this.selectedElements = newSelection;
      if (newSelection && newSelection.length > 0)
        this.primarySelection = newSelection[0];
      else
        this.primarySelection = null;
      this.selectedPart = selectedPart?.designItem === this.primarySelection ? selectedPart : null;
    }
    this.onSelectionChanged.emit({ selectedElements: this.selectedElements, oldSelectedElements: oldSelectedElements, selectedPart: this.selectedPart, oldSelectedPart, event });
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
