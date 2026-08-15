import {
    AbstractPropertiesService, IDesignItem, IProperty, PropertyType, RefreshMode
} from '@node-projects/web-component-designer';
import { ZplText } from '../widgets/zpl-text.js';

export class ZplTextPropertiesService extends AbstractPropertiesService {
    public name = 'zplText';

    override getRefreshMode(): RefreshMode {
        return RefreshMode.fullOnValueChange;
    }

    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof ZplText;
    }

    protected override _notifyChangedProperty(designItem: IDesignItem) {
        (designItem.element as ZplText).refreshFromAttributes();
    }

    override async getProperties(): Promise<IProperty[]> {
        const definitions: Omit<IProperty, 'service' | 'propertyType'>[] = [
            { name: 'content', type: 'string', attributeName: 'content' },
            { name: 'fontName', displayName: 'font', type: 'enum', attributeName: 'font-name', enumValues: [...'0ABCDEFGH'].map(value => [value, value]) },
            { name: 'fontHeight', displayName: 'font height', type: 'number', attributeName: 'font-height', min: 1, max: 32000, step: 1 },
            { name: 'fontWidth', displayName: 'font width (0 = automatic)', type: 'number', attributeName: 'font-width', min: 0, max: 32000, step: 1 },
            { name: 'rotation', type: 'enum', attributeName: 'rotation', enumValues: ['N', 'R', 'I', 'B'].map(value => [value, value]) }
        ];
        return definitions.map(property => ({ ...property, service: this, propertyType: PropertyType.attribute } as IProperty));
    }
}
