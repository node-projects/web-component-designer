import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class PickColorTool implements ITool {
  cursor: string;
  
  pointerEventHandler(designerView: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
  }
  
  dispose(): void {
  }
}