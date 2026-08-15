import {
    AbstractPropertiesService, IDesignItem, IProperty, PropertyType, RefreshMode, ValueType
} from '@node-projects/web-component-designer';

const includeProperty: Omit<IProperty, 'service'> = {
    name: 'includeInZplOutput',
    displayName: 'Include in ZPL output',
    type: 'boolean',
    propertyType: PropertyType.attribute,
    attributeName: 'node-projects-hide-at-run-time',
    defaultValue: true,
    description: 'When disabled, the item is preserved in metadata comments but omitted from printer output.'
};

export class ZplIncludeInOutputPropertiesService extends AbstractPropertiesService {
    public name = 'zplIncludeInOutput';

    override getRefreshMode(): RefreshMode {
        return RefreshMode.fullOnValueChange;
    }

    override isHandledElement(designItem: IDesignItem): boolean {
        return !designItem.isRootItem && designItem.element.localName.startsWith('zpl-');
    }

    override async getProperties(): Promise<IProperty[]> {
        return [{ ...includeProperty, service: this }];
    }

    override getValue(designItems: IDesignItem[]): boolean {
        return designItems.length > 0 && designItems.every(item => !item.hideAtRunTime);
    }

    override getUnsetValue(): boolean {
        return true;
    }

    override isSet(): ValueType {
        return ValueType.all;
    }

    override async setValue(designItems: IDesignItem[], _property: IProperty, value: boolean) {
        if (designItems.length === 0) return;
        const group = designItems[0].openGroup(value ? 'Include in ZPL output' : 'Exclude from ZPL output');
        try {
            for (const designItem of designItems) {
                if (this.isHandledElement(designItem)) designItem.hideAtRunTime = !value;
            }
            group.commit();
        } catch (error) {
            group.abort();
            throw error;
        }
    }

    override clearValue(designItems: IDesignItem[], property: IProperty) {
        void this.setValue(designItems, property, true);
    }
}
