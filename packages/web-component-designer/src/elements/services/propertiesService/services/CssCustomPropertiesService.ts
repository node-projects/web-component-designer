import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { ValueType } from '../ValueType.js';
import { BindingTarget } from '../../../item/BindingTarget.js';

export class CssCustomPropertiesService extends CommonPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnValueChange;
  }

  constructor() {
    super();
    this.name = 'customProperties';
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.cssValue };
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    if (!designItem?.element?.computedStyleMap)
      return null;

    let rootMap = Array.from(designItem.instanceServiceContainer.designerCanvas.rootDesignItem.element.computedStyleMap()).map(x => x[0]).filter(key => key.startsWith("--"));

    let props = Array.from(designItem.element.computedStyleMap()).map(x => x[0]).filter(key => key.startsWith("--"))

    let arr: IProperty[] = props.filter(x => !rootMap.includes(x)).map(x => ({
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
    return getComputedStyle(designItems[0].element).getPropertyValue(property.name);
  }

  override getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems?.[0].element?.computedStyleMap) {
      return designItems[0].element.computedStyleMap().get(property.name)?.[0];
    }
    return null;
  }

  override isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    return designItems[0].hasStyle(property.name) ? ValueType.all : ValueType.none;
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.cssvar;
  }
}
