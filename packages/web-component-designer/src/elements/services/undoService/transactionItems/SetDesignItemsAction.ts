import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { InstanceServiceContainer } from '../../InstanceServiceContainer.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class SetDesignItemsAction implements ITransactionItem {

  constructor(newDesignItems: IDesignItem[], oldDesignItems: IDesignItem[], private container: InstanceServiceContainer = newDesignItems[0]?.instanceServiceContainer ?? oldDesignItems[0]?.instanceServiceContainer) {
    this.title = "Set all DesignItems";

    this.newDesignItems = newDesignItems;
    this.oldDesignItems = oldDesignItems;
  }

  title?: string;

  get affectedItems() {
    return this.newDesignItems;
  }

  undo(): IContentChanged[] | null {
    this.setItems(this.oldDesignItems);
    return null;
  }

  do(): IContentChanged[] | null {
    this.setItems(this.newDesignItems);
    return null;
  }

  private setItems(items: IDesignItem[]) {
    if (this.container.editingDocument)
      this.container.editingDocument.replaceItems(items);
    else
      this.container.designerCanvas._internalSetDesignItems(items);
  }

  public newDesignItems: IDesignItem[];
  public oldDesignItems: IDesignItem[];

  mergeWith(other: ITransactionItem) {
    return false
  }
}