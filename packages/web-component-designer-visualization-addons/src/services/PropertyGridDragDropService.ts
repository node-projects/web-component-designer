import { IProperty, IDesignItem, IPropertyGridDragDropService } from "@node-projects/web-component-designer";

export class PropertyGridDragDropService implements IPropertyGridDragDropService {

    dragOverOnProperty?(event: DragEvent, property: IProperty, designItems: IDesignItem[]): 'none' | 'copy' | 'link' | 'move' {
        return 'copy';
    }

    dropOnProperty?(event: DragEvent, property: IProperty, dropObject: any, designItems: IDesignItem[]) {
        property.service.setValue(designItems, property, dropObject.text);
    }
}