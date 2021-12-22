import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IBindableObject } from "./IBindableObject.js";

export interface IBindableObjectDragDropService {
  dragOver(event: DragEvent, bindableObject: IBindableObject): 'none' | 'copy' | 'link' | 'move';
  drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject);
}