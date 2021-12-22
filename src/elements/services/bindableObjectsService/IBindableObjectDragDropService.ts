import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IBindableObject } from "./IBindableObject.js";

export interface IBindableObjectDragDropService {
  dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent);
  dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent);
  dragOver(designerCanvas: IDesignerCanvas, event: DragEvent): 'none' | 'copy' | 'link' | 'move';
  drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<any>);
}