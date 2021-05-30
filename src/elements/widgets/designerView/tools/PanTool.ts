import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class PanTool implements ITool {
  
  readonly cursor: string = 'grab';
  
  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
  }
  
  dispose(): void {
  }
}