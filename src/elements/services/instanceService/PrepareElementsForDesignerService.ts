import { IDesignItem } from "../../item/IDesignItem.js";
import { IPrepareElementsForDesignerService } from "./IPrepareElementsForDesignerService.js";

export class PrepareElementsForDesignerService implements IPrepareElementsForDesignerService {

  prepareElementsForDesigner(designItem: IDesignItem) {
    this._prepareElementsForDesigner([designItem.element]);
  }

  private _prepareElementsForDesigner(elements: NodeListOf<Node> | Node[]) {
    for (let e of elements) {
      if ((<HTMLElement>e).shadowRoot) {
        this._prepareElementsForDesigner(((<HTMLElement>e).shadowRoot).querySelectorAll('*'));
      }
      if (e instanceof HTMLImageElement) {
        e.draggable = false;
      }
      else if (e instanceof HTMLInputElement) {
        e.onmousedown = (e) => e.preventDefault();
      }
    }
  }
}
