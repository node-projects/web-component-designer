import { IDesignItem } from "../../item/IDesignItem.js";

export interface IRenderedDesignItemService {
  updateRenderedDesignItem(designItem: IDesignItem): void;
  updateRenderedNode(node: Node): Node;
}
