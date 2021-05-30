import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class TextTool implements ITool {
  
  constructor() {
  }
  dispose(): void {
  }

  readonly cursor = 'text';

  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
   
  }
}