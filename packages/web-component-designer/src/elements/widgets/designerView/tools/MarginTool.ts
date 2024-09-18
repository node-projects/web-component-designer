import { EventNames } from '../../../../enums/EventNames.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { ChangeGroup } from '../../../services/undoService/ChangeGroup.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';
import { NamedTools } from './NamedTools.js';

export class MarginTool implements ITool {

  readonly cursor: string = 'pointer';
  private _changeGroup: ChangeGroup;

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    (<ITool>designerCanvas.serviceContainer.designerTools.get(NamedTools.Pointer)).pointerEventHandler(designerCanvas, event, currentElement);
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) {
    event.preventDefault();
    const sel = designerCanvas.instanceServiceContainer.selectionService.primarySelection;
    const cs = getComputedStyle(sel.element);
    let nm = ""
    switch (event.key) {
      case "ArrowLeft":
        nm = "margin-left";
        break;
      case "ArrowRight":
        nm = "margin-right";
        break;
      case "ArrowUp":
        nm = "margin-top";
        break;
      case "ArrowDown":
        nm = "margin-bottom";
        break;
    }
    if (nm) {
      if (event.type == EventNames.KeyDown && !this._changeGroup)
        this._changeGroup = sel.openGroup("change margin");
      if (this._changeGroup) {
        sel.setStyleAsync(nm, (parseFloat(cs[nm]) + (event.altKey ? -1 : 1)) + "px");
        if (event.type == EventNames.KeyUp) {
          this._changeGroup.commit();
          this._changeGroup = null;
        }
      }
    }
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
    if (this._changeGroup) {
      this._changeGroup.abort();
      this._changeGroup = null;
    }
  }
}