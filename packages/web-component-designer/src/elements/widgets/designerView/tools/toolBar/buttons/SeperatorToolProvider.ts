import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";

export class SeperatorToolProvider implements IDesignViewToolbarButtonProvider {
  constructor(distance: number) {
    this.distance = distance;
  }

  distance: number;

  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    const div = document.createElement('div');
    div.style.marginTop = this.distance + 'px';
    return div;
  }
}