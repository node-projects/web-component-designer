import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class TextTool implements ITool {
  
  constructor() {
  }
  dispose(): void {
  }

  readonly cursor = 'text';

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
   
  }
}