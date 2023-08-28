import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";

export interface IPropertyGridDragDropService {
  dragOverOnProperty?(event: DragEvent, property: IProperty, designItems: IDesignItem[]): 'none' | 'copy' | 'link' | 'move';
  dropOnProperty?(event: DragEvent, property: IProperty, dropObject: any, designItems: IDesignItem[]): void;
}