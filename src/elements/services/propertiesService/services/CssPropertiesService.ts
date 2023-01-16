import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { BindingTarget } from '../../../item/BindingTarget.js';
import { PropertyType } from '../PropertyType.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import cssProperties from './CssProperties.json' assert { type: 'json' };

export class CssPropertiesService extends CommonPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  //metrics

  public layout = [
    "display",
    "color",
    "background-color",
    "box-sizing",
    "border",
    "box-shadow",
    "opacity",
    "position",
    "font-size",
    "font-weight",
    "inset",
    "margin",
    "border",
    "padding"
  ]

  public grid = [
    "display",
    "position",
    "grid-template-columns",
    "grid-template-rows",
    "column-gap",
    "row-gap",
    "align-content",
    "justify-content",
    "align-items",
    "justify-items"
  ];

  public flex = [
    "display",
    "position",
    "flex-direction",
    "flex-wrap",
    "align-content",
    "justify-content",
    "align-items"
  ];

  constructor(name: 'layout' | 'grid' | 'flex') {
    super();
    this.name = name;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return this[this.name][name]
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    const propNames: string[] = this[this.name];
    const propertiesList = propNames.map(x => ({
      name: x,
      type: cssProperties[x]?.type ?? 'string',
      values: cssProperties[x]?.values ? [...cssProperties[x]?.values, 'initial', 'inherit', 'unset'] : ['initial', 'inherit', 'unset'],
      service: this,
      propertyType: PropertyType.cssValue
    }));
    return propertiesList;
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.css;
  }
}
