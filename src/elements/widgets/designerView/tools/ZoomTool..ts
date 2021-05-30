import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class ZoomTool implements ITool {

  readonly cursor: string = 'zoom-in';
  
  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
  }
  
  dispose(): void {
  }
}