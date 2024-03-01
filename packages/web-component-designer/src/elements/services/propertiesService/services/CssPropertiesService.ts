import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { BindingTarget } from '../../../item/BindingTarget.js';
import { PropertyType } from '../PropertyType.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { PropertiesHelper } from './PropertiesHelper.js';
import { GridAssignedRowColumnPropertyEditor } from '../propertyEditors/special/GridAssignedRowColumnPropertyEditor.js';
import { MetricsPropertyEditor } from '../propertyEditors/special/MetricsPropertyEditor.js';
import cssProperties from "./CssProperties.json"  assert { type: 'json' };

export class CssPropertiesService extends CommonPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  //metrics

  public layout = {
    "common": [
      "display",
      "color",
      "background-color",
      "box-sizing",
      "border",
      "box-shadow",
      "opacity",
      "position",
    ],
    "font": [
      "font-family",
      "font-size",
      "font-weight",
    ],
    "layout": [
      "inset",
      "margin",
      "border",
      "padding",
      "overflow",
      "metrics"
    ]
  }

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
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-opacity"
  ];


  constructor(name: 'layout' | 'grid' | 'gridChild' | 'flex' | 'flexChild' | 'svg') {
    super(false);
    this.name = name;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return this._getPropertyDef(name);
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    const propNames: string[] | Record<string, string[]> = this[this.name];
    if (Array.isArray(propNames)) {
      const propertiesList = propNames.map(x => this._getPropertyDef(x));
      return propertiesList;
    } else {
      let grps: IPropertyGroup[] = [];
      for (let g in propNames) {
        let grp: IPropertyGroup = { name: g, properties: propNames[g].map(x => this._getPropertyDef(x)) };
        grps.push(grp);
      }
      return grps;
    }
  }

  _getPropertyDef(name: string): IProperty {
    const camelName = PropertiesHelper.dashToCamelCase(name);
    switch (camelName) {
      case 'assignedRowColumn':
        return { name, service: this, propertyType: PropertyType.complex, createEditor: (p) => new GridAssignedRowColumnPropertyEditor(p) };
      case 'metrics':
        return { name, service: this, propertyType: PropertyType.complex, createEditor: (p) => new MetricsPropertyEditor(p) };
      default:
        return {
          name,
          type: cssProperties[camelName]?.type ?? 'string',
          values: cssProperties[camelName]?.values ? [...cssProperties[camelName]?.values, 'initial', 'inherit', 'unset'] : ['initial', 'inherit', 'unset'],
          service: this,
          propertyType: PropertyType.cssValue
        }
    }
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.css;
  }
}
