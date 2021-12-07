import { DesignerView } from "./designerView.js";
import { IDesignerCanvas } from "./IDesignerCanvas.js";
import { IDesignViewConfigButtonsProvider } from "./IDesignViewConfigButtonsProvider.js";

export class ButtonSeperatorProvider implements IDesignViewConfigButtonsProvider {

  _space: number
  constructor(space: number) {
    this._space = space;
  }
  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {
    const div = document.createElement('div');
    div.style.marginLeft = this._space + 'px';
    return [div];
  }
}