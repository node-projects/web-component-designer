import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";

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

    setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    }

    clearValue(designItems: IDesignItem[], property: IProperty) {
    }
  
    isSet(designItems: IDesignItem[], property: IProperty): ValueType {
      return ValueType.none;
    }
  
    getValue(designItems: IDesignItem[], property: IProperty) {
      return null;
    }
  
    getUnsetValue(designItems: IDesignItem[], property: IProperty) {
      return null;
    }
}
