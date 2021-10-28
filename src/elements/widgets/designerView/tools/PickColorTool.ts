import { EventNames } from '../../../../enums/EventNames.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class PickColorTool implements ITool {
  cursor: string;

  async pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    if (event.type == EventNames.PointerDown) {
      //@ts-ignore
      const eyeDropper = new EyeDropper();
      const colorSelectionResult = await eyeDropper.open();
      const color = colorSelectionResult.sRGBHex;
      
      if (event.button == 2)
        designerCanvas.serviceContainer.globalContext.fillBrush = color;
      else
        designerCanvas.serviceContainer.globalContext.strokeColor = color;

      designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
    }
  }

  dispose(): void {
  }
}