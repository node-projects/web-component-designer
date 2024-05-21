import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { ValueType } from '../ValueType.js';
import { BindingTarget } from '../../../item/BindingTarget.js';
import { DesignerCanvas } from '../../../widgets/designerView/designerCanvas.js';
import { AbstractCssPropertiesService } from './AbstractCssPropertiesService.js';

export class CssCustomPropertiesService extends AbstractCssPropertiesService {


  removeInheritedCustomProperties: boolean

  constructor(removeInheritedCustomProperties = true) {
    super();
    this.name = 'customProperties';
    this.removeInheritedCustomProperties = removeInheritedCustomProperties;
  }

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnValueChange;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override async getProperty(designItem: IDesignItem, name: string): Promise<IProperty> {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.cssValue };
  }

  override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    if (!designItem?.element?.computedStyleMap)
      return null;

    let rootMap = Array.from((<DesignerCanvas>designItem.instanceServiceContainer.designerCanvas).computedStyleMap()).map(x => x[0]).filter(key => key.startsWith("--"));

    let props = Array.from(designItem.element.computedStyleMap()).map(x => x[0]).filter(key => key.startsWith("--"))

    if (this.removeInheritedCustomProperties)
      props = props.filter(x => !rootMap.includes(x));

    let arr: IProperty[] = props.map(x => ({
      name: x,
      service: this,
      propertyType: PropertyType.cssValue
    }));
    return arr;
  }

  override clearValue(designItems: IDesignItem[], property: IProperty, clearType: 'all' | 'binding' | 'value') {
    super.clearValue(designItems, property, clearType);
  }

  override getValue(designItems: IDesignItem[], property: IProperty) {
    let val = designItems[0].getStyle(property.name);
    if (val)
      return val;
    return getComputedStyle(designItems[0].element).getPropertyValue(property.name);
  }

  override getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems?.[0].element?.computedStyleMap) {
      return designItems[0].element.computedStyleMap().get(property.name)?.[0];
    }
    return null;
  }

  override isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    if (super.isSet(designItems, property) == ValueType.bound)
      return ValueType.bound;
    return designItems[0].hasStyle(property.name) ? ValueType.all : ValueType.none;
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.cssvar;
  }
}
