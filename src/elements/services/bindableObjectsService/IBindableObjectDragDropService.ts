import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IProperty } from "../propertiesService/IProperty.js";
import { IBindableObject } from "./IBindableObject.js";

export interface IBindableObjectDragDropService {
  dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element);
  dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element);
  dragOver(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): 'none' | 'copy' | 'link' | 'move';
  drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<any>, element: Element);

  dragOverOnProperty?(event: DragEvent, property: IProperty): 'none' | 'copy' | 'link' | 'move';
  dropOnProperty?(event: DragEvent, property: IProperty);
}