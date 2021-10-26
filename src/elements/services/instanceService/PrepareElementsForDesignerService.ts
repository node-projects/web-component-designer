import { IDesignItem } from "../../item/IDesignItem.js";
import { IPrepareElementsForDesignerService } from "./IPrepareElementsForDesignerService.js";

export class PrepareElementsForDesignerService implements IPrepareElementsForDesignerService {

  prepareElementsForDesigner(designItem: IDesignItem) {
    if (designItem !== designItem.instanceServiceContainer.contentService.rootDesignItem)
      this._prepareElementsForDesigner([designItem.element], true);
    this._prepareElementsForDesigner(designItem.element.querySelectorAll('*'), true);
  }

  private _prepareElementsForDesigner(elements: NodeListOf<Node> | Node[], rootElements: boolean) {
    for (let el of elements) {
      if ((<HTMLElement>el).shadowRoot) {
        this._prepareElementsForDesigner(((<HTMLElement>el).shadowRoot).querySelectorAll('*'), false);
      }
      if (el instanceof HTMLElement) {
        el.onclick = null;
        el.onmousedown = null;
        el.onmouseup = null;
        if (!rootElements)
          el.style.pointerEvents = 'none';
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
