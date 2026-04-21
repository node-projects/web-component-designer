import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

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

  undo(): IContentChanged[] | null {
    this.newDesignItems[0].instanceServiceContainer.designerCanvas._internalSetDesignItems(this.oldDesignItems);
    return null;
  }

  do(): IContentChanged[] | null {
    this.newDesignItems[0].instanceServiceContainer.designerCanvas._internalSetDesignItems(this.newDesignItems);
    return null;
  }

  public newDesignItems: IDesignItem[];
  public oldDesignItems: IDesignItem[];

  mergeWith(other: ITransactionItem) {
    return false
  }
}