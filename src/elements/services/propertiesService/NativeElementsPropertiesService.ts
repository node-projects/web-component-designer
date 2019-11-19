import { IPropertiesService } from "./IPropertiesService";
import { IProperty } from './IProperty';
import { IDesignItem } from '../../item/IDesignItem';

export class NativeElementsPropertiesService implements IPropertiesService {
    public name = "native"

    isHandledElement(designItem: IDesignItem): boolean {
        switch (designItem.element.localName) {
            case 'input':
            case 'button':
            case 'a':
            case 'div':
                return true;
        }
        return false;
    }

    getProperties(designItem: IDesignItem): IProperty[] {
        if (!this.isHandledElement(designItem))
            return null;

        return null;
    }

    setValue(designItem: IDesignItem, property: IProperty, value: any) {
    }

    getValue(designItem: IDesignItem, property: IProperty) {
       return null;
    }
}
