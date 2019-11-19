import { TypedEvent } from "../../../basic/TypedEvent.js";
export class SelectionService {
  constructor() {
    this.selectedElements = [];
    this.onSelectionChanged = new TypedEvent();
  }

  setSelectedElements(designItems) {
    let oldSelectedElements = this.selectedElements;

    if (!designItems) {
      this.selectedElements = [];
      this.primarySelection = null;
    } else {
      this.selectedElements = designItems;
      if (designItems && designItems.length > 0) this.primarySelection = designItems[0];else this.primarySelection = null;
    }

    this.onSelectionChanged.emit({
      selectedElements: this.selectedElements,
      oldSelectedElements: oldSelectedElements
    });
  }

}