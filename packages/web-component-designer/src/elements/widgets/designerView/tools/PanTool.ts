import { EventNames } from '../../../../enums/EventNames.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';

export class PanTool implements ITool {

  readonly cursor: string = 'grab';

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        designerCanvas.captureActiveTool(this);
        break;

      case EventNames.PointerMove:
        if (event.buttons == 1 || event.buttons == 4) {
          designerCanvas.canvasOffset = { x: designerCanvas.canvasOffset.x + + event.movementX / designerCanvas.zoomFactor, y: designerCanvas.canvasOffset.y + event.movementY / designerCanvas.zoomFactor };
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerCanvas.releaseActiveTool();
        break;
    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) 
  { }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }
}