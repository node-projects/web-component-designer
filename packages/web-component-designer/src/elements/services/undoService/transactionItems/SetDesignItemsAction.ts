import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';

export class SetDesignItemsAction implements ITransactionItem {

  constructor(newDesignItems: IDesignItem[], oldDesignItems: IDesignItem[]) {
    this.title = "Set all DesignItems";

    this.newDesignItems = newDesignItems;
    this.oldDesignItems = oldDesignItems;
  }

  title?: string;

  get affectedItems() {
    return this.newDesignItems;
  }

  undo() {
    this.newDesignItems[0].instanceServiceContainer.designerCanvas._internalSetDesignItems(this.oldDesignItems);
  }

  do() {
    this.newDesignItems[0].instanceServiceContainer.designerCanvas._internalSetDesignItems(this.newDesignItems);
  }

  public newDesignItems: IDesignItem[];
  public oldDesignItems: IDesignItem[];

  mergeWith(other: ITransactionItem) {
    return false
  }
}