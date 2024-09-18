import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';

export class SimpleToolButtonProvider implements IDesignViewToolbarButtonProvider {
  private _name: string;
  private _icon: string;
  constructor(name: string, icon: string) {
    this._name = name;
    this._icon = icon;
  }
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    let obj = {};
    obj[this._name] = { icon: this._icon }
    return new DesignerToolbarButton(designerCanvas, obj);
  }
}