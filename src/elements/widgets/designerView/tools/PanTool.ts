import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class PanTool implements ITool {
  
  readonly cursor: string = 'grab';
  
  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
  }
  
  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }
}