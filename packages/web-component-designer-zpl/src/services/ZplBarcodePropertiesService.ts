import {
    AbstractPropertiesService, IDesignItem, IProperty, PropertyType, RefreshMode
} from '@node-projects/web-component-designer';
import { getBarcodeDefinition } from '../barcodes/barcodeRegistry.js';
import { ZplBarcode } from '../widgets/zpl-barcode.js';

export class ZplBarcodePropertiesService extends AbstractPropertiesService {
    public name = 'zplBarcode';

    override getRefreshMode(): RefreshMode {
        return RefreshMode.fullOnValueChange;
    }

    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof ZplBarcode;
    }

    protected override _notifyChangedProperty(designItem: IDesignItem) {
        (designItem.element as ZplBarcode).refreshFromAttributes();
    }

    override async getProperties(designItem: IDesignItem): Promise<IProperty[]> {
        const definition = getBarcodeDefinition(designItem.getAttribute('type'));
        return definition.properties.map(property => ({
            name: property.name,
            displayName: property.name.replace(/[A-Z]/g, value => ` ${value.toLowerCase()}`),
            attributeName: property.attributeName,
            type: property.type === 'enum' ? 'enum' : property.type,
            min: property.min,
            max: property.max,
            step: property.step,
            enumValues: property.values?.map(value => [value, value]),
            defaultValue: definition.defaults[property.name],
            service: this,
            propertyType: PropertyType.attribute
        } as IProperty));
    }

    override getValue(designItems: IDesignItem[], property: IProperty): any {
        if (property.type !== 'boolean') return super.getValue(designItems, property);
        const value = designItems[0]?.getAttribute(property.attributeName ?? property.name);
        if (value == null) return property.defaultValue ?? false;
        return value === '' || value === 'true' || value === 'Y';
    }

    override async setValue(designItems: IDesignItem[], property: IProperty, value: any) {
        if (property.type !== 'boolean') return super.setValue(designItems, property, value);
        if (designItems.length === 0) return;
        const group = designItems[0].openGroup(`property changed: ${property.name} to ${value}`);
        try {
            for (const designItem of designItems) {
                if (this.isHandledElement(designItem)) {
                    designItem.setAttribute(property.attributeName ?? property.name, value ? 'true' : 'false');
                    this._notifyChangedProperty(designItem);
                }
            }
            group.commit();
        } catch (error) {
            group.abort();
            throw error;
        }
    }
}
