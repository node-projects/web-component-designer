import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class TextTool implements ITool {
  
  constructor() {
  }
  dispose(): void {
  }

  readonly cursor = 'text';

  pointerEventHandler(designerView: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
   
  }
}