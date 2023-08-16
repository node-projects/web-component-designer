import { IDesignItem } from "../../item/IDesignItem.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IProperty } from "../propertiesService/IProperty.js";
import { IBindableObject } from "./IBindableObject.js";

export interface IBindableObjectDragDropService {
  dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): void;
  dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): void;
  dragOver(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): 'none' | 'copy' | 'link' | 'move';
  drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<any>, element: Element): void;

  dragOverOnProperty?(event: DragEvent, property: IProperty, designItems: IDesignItem[]): 'none' | 'copy' | 'link' | 'move';
  dropOnProperty?(event: DragEvent, property: IProperty, bindableObject: IBindableObject<any>, designItems: IDesignItem[]): void;
}