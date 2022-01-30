import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { ServiceContainer } from '../../../services/ServiceContainer';

export class PickColorTool implements ITool {

  readonly cursor = 'crosshair';

  async activated(serviceContainer: ServiceContainer) {
    try {
      //@ts-ignore
      const eyeDropper = new EyeDropper();
      const colorSelectionResult = await eyeDropper.open();
      const color = colorSelectionResult.sRGBHex;

      serviceContainer.globalContext.strokeColor = color;
    }
    finally {
      serviceContainer.globalContext.finishedWithTool(this);
    }
  }

  async pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) 
  { }
  
  dispose(): void {
  }
}