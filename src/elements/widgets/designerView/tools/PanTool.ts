import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class PanTool implements ITool {
  
  readonly cursor: string = 'grab';
  
  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
  }
  
  dispose(): void {
  }
}