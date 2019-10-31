import { IPropertiesService } from "./IPropertiesService";
import { IProperty } from './IProperty';

export class NativeElementsPropertiesService implements IPropertiesService {
    public name = "native"

    isHandledElement(element: Element): boolean {
        switch (element.localName) {
            case 'input':
            case 'button':
            case 'a':
            case 'div':
                return true;
        }
        return false;
    }

    getProperties(element: Element): IProperty[] {
        if (!this.isHandledElement(element))
            return null;

        return null;
    }
}
