import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class ZoomTool implements ITool {

  readonly cursor: string = 'zoom-in';
  
  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
  }
  
  dispose(): void {
  }
}