import { IDesignItem } from "../../item/IDesignItem.js";
import { DeleteAction } from "../undoService/transactionItems/DeleteAction.js";
import { IDeletionService } from "./IDeletionService.js";

export class DeletionService implements IDeletionService {
  public removeItems(items: IDesignItem[]) {
    items[0].instanceServiceContainer.undoService.execute(new DeleteAction(items));
    items[0].serviceContainer.referencesChangedService.notifyReferencesChanged(items.map(item => ({ designItem: item, type: 'deleted' })));
  }
}