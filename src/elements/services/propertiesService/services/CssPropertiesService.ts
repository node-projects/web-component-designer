import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { BindingTarget } from '../../../item/BindingTarget.js';
import { PropertyType } from '../PropertyType.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { PropertiesHelper } from './PropertiesHelper.js';

//TODO: remove this code when import asserts are supported
let cssProperties: any;
//@ts-ignore
if (window.importShim) {
  const cssPropertiesUrl = import.meta.resolve('./CssProperties.json')
  //@ts-ignore
  cssProperties = await importShim(cssPropertiesUrl, { assert: { type: 'json' } });
} else
  //@ts-ignore
  cssProperties = await import("./CssProperties.json", { assert: { type: 'json' } });

if (cssProperties.default)
  cssProperties = cssProperties.default;

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
    "padding",
    "overflow",
    "metrics"
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
    "justify-items",
  ];

  public gridChild = [
    "grid-row",
    "grid-column",
    "assigned-row-column",
    "align-self",
    "justify-self"
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

  public flexChild = [
    "align-self",
    "justify-self"
  ];

  public svg = [
    "fill",
    "fill-rule",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-dash-array",
    "stroke-opacity"
  ];


  constructor(name: 'layout' | 'grid' | 'gridChild' | 'flex' | 'flexChild' | 'svg') {
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
    const propertiesList = propNames.map(x => {
      const camelName = PropertiesHelper.dashToCamelCase(x);
      return {
        name: x,
        type: this.getPropertyType(camelName),
        values: cssProperties[camelName]?.values ? [...cssProperties[camelName]?.values, 'initial', 'inherit', 'unset'] : ['initial', 'inherit', 'unset'],
        service: this,
        propertyType: PropertyType.cssValue
      }
    });
    return propertiesList;
  }

  getPropertyType(camelName: string): string {
    switch (camelName) {
      case 'assignedRowColumn':
        return 'assigned-row-column';
      case 'metrics':
        return 'metrics';
      default:
        return cssProperties[camelName]?.type ?? 'string';
    }
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.css;
  }
}
