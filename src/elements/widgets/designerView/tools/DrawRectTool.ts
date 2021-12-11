import { EventNames } from '../../../../enums/EventNames';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { ServiceContainer } from '../../../services/ServiceContainer.js';



export class DrawRectTool implements ITool {

  readonly cursor = 'crosshair';


  constructor() {
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {



    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        console.log("Rect Tool Pressed");

        break;


      case EventNames.PointerMove:

        break;


      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);

        break;
    }
  }
}
