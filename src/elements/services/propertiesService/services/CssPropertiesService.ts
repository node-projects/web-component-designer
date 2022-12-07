import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { BindingTarget } from '../../../item/BindingTarget.js';
import { PropertyType } from '../PropertyType';
import { CommonPropertiesService } from './CommonPropertiesService';
import { RefreshMode } from '../IPropertiesService';

export class CssPropertiesService extends CommonPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return this.name == 'styles' ? RefreshMode.fullOnValueChange : RefreshMode.none;
  }

  public layout: IProperty[] = [
    {
      name: "display",
      type: "list",
      values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"],
      service: this,
      propertyType: PropertyType.cssValue
    },
    {
      name: "color",
      type: "color",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "background-color",
      type: "color",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "box-sizing",
      type: "list",
      values: ["border-box", "content-box"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "border",
      type: "string",
      default: "0px none rbg(0,0,0)",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "box-shadow",
      type: "string",
      default: "none",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "opacity",
      type: "number",
      min: 0,
      max: 1,
      step: 0.1,
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "metrics",
      type: "metrics",
      service: this,
      propertyType: PropertyType.complex
    }, {
      name: "position",
      type: "list",
      values: ["static", "relative", "absolute"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "font-size",
      type: "css-length",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "font-weight",
      type: "list",
      values: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900", "lighter", "bolder"],
      service: this,
      propertyType: PropertyType.cssValue
    }
  ];

  public grid: IProperty[] = [
    {
      name: "display",
      type: "list",
      values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "position",
      type: "list",
      values: ["static", "relative", "absolute"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "grid-template-columns",
      type: "string",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "grid-template-rows",
      type: "string",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "column-gap",
      type: "css-length",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "row-gap",
      type: "css-length",
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "align-content",
      type: "img-list",
      values: ["center", "space-between", "space-around", "space-evenly", "stretch"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "justify-content",
      type: "img-list",
      values: ["center", "start", "end", "space-between", "space-around", "space-evenly"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "align-items",
      type: "img-list",
      values: ["center", "start", "end", "stretch", "baseline"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "justify-items",
      type: "img-list",
      values: ["center", "start", "end", "stretch"],
      service: this,
      propertyType: PropertyType.cssValue
    }
  ];

  public flex: IProperty[] = [
    {
      name: "display",
      type: "list",
      values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "position",
      type: "list",
      values: ["static", "relative", "absolute"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "flex-direction",
      type: "img-list",
      values: ["row", "column"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "flex-wrap",
      type: "img-list",
      values: ["nowrap", "wrap"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "align-content",
      type: "img-list",
      values: ["center", "flex-start", "flex-end", "space-between", "space-around", "stretch"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "justify-content",
      type: "img-list",
      values: ["center", "flex-start", "flex-end", "space-between", "space-around", "space-evenly"],
      service: this,
      propertyType: PropertyType.cssValue
    }, {
      name: "align-items",
      type: "img-list",
      values: ["center", "flex-start", "flex-end", "stretch", "baseline"],
      service: this,
      propertyType: PropertyType.cssValue
    }
  ];

  constructor(name: 'styles' | 'layout' | 'grid' | 'flex') {
    super();
    this.name = name;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    if (this.name == 'styles') {
      return { name: name, type: 'string', service: this, propertyType: PropertyType.cssValue };
    }
    return this[this.name][name]
  }

  override getProperties(designItem: IDesignItem): IProperty[] {
    if (this.name == 'styles') {
      if (!designItem)
        return [];
      let arr: IProperty[] = Array.from(designItem.styles.keys(), x => ({ name: x, renamable: true, type: 'string', service: this, propertyType: PropertyType.cssValue }));
      arr.push({ name: '', type: 'addNew', service: this, propertyType: PropertyType.complex });
      return arr;
    }
    return this[this.name];
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.css;
  }

  override setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    if (this.name == 'styles') {
      super.setValue(designItems, { ...property, propertyType: PropertyType.cssValue }, value);
    } else {
      super.setValue(designItems, property, value);
    }
  }
}
