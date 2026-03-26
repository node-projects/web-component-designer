import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";

export interface IExternalDragDropService {
  dragOver(designerCanvas: IDesignerCanvas, event: DragEvent): 'none' | 'copy' | 'link' | 'move';
  drop(designerCanvas: IDesignerCanvas, event: DragEvent);
}