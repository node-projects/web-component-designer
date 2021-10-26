import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class PanTool implements ITool {
  
  readonly cursor: string = 'grab';
  
  pointerEventHandler(designerView: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
  }
  
  dispose(): void {
  }
}