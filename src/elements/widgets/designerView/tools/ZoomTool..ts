import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class ZoomTool implements ITool {

  readonly cursor: string = 'zoom-in';
  
  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    throw new Error('Method not implemented.');
  }
  
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}