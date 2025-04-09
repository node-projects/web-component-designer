import { IDesignItem } from "../../item/IDesignItem.js";
import { DeleteAction } from "../undoService/transactionItems/DeleteAction.js";
import { IDeletionService } from "./IDeletionService.js";

export class DeletionService implements IDeletionService {
  public removeItems(items: IDesignItem[]) {
    items[0].instanceServiceContainer.undoService.execute(new DeleteAction(items));
  }
}