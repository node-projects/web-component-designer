import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class PickColorTool implements ITool {
  cursor: string;
  
  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
  }
  
  dispose(): void {
  }
}