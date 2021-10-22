import { IDesignItem } from "../../item/IDesignItem.js";
import { IPrepareElementsForDesignerService } from "./IPrepareElementsForDesignerService.js";

export class PrepareElementsForDesignerService implements IPrepareElementsForDesignerService {

  prepareElementsForDesigner(designItem: IDesignItem) {
    this._prepareElementsForDesigner([designItem.element]);
  }

  private _prepareElementsForDesigner(elements: NodeListOf<Node> | Node[]) {
    for (let el of elements) {
      if ((<HTMLElement>el).shadowRoot) {
        this._prepareElementsForDesigner(((<HTMLElement>el).shadowRoot).querySelectorAll('*'));
      }
      if (el instanceof HTMLImageElement) {
        el.draggable = false;
      }
      else if (el instanceof HTMLInputElement) {
        el.onmousedown = (e) => e.preventDefault();
        //const ip = el;
        //el.onclick = (e) => { if (ip.type == 'checkbox') ip.checked = !ip.checked };
      }
      else if (el instanceof HTMLSelectElement) {
        el.onmousedown = (e) => e.preventDefault();
      }
    }
  }
}
