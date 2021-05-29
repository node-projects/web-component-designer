import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class MagicWandTool implements ITool {
  cursor: string;
  
  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    throw new Error('Method not implemented.');
  }
  
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}