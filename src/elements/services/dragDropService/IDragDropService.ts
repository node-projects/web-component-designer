import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";

export interface IDragDropService {
  dragOver(event: DragEvent): 'none' | 'copy' | 'link' | 'move';
  drop(designerView: IDesignerCanvas, event: DragEvent);
}