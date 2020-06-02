import { IPropertiesService } from '../IPropertiesService';
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from '../ValueType';

export class CssPropertiesService implements IPropertiesService {

  //@ts-ignore
  private styles: IProperty[] = [
    {
      name: "color",
      type: "color",
      service: this
    }, {
      name: "background-color",
      type: "color",
      service: this
    }, {
      name: "box-sizing",
      type: "list",
      values: ["border-box", "content-box"],
      service: this
    }, {
      name: "border",
      type: "string",
      default: "0px none rbg(0,0,0)",
      service: this
    }, {
      name: "box-shadow",
      type: "string",
      default: "none",
      service: this
    }, {
      name: "opacity",
      type: "number",
      min: 0,
      max: 0,
      service: this
    }, {
      name: "padding",
      type: "thickness",
      service: this
    }, {
      name: "margin",
      type: "thickness",
      service: this
    }, {
      name: "position",
      type: "list",
      values: ["static", "relative", "absolute"],
      service: this
    }, {
      name: "left",
      type: "css-length",
      service: this
    }, {
      name: "top",
      type: "css-length",
      service: this
    }, {
      name: "right",
      type: "css-length",
      service: this
    }, {
      name: "bottom",
      type: "css-length",
      service: this
    }, {
      name: "width",
      type: "css-length",
      service: this
    }, {
      name: "height",
      type: "css-length",
      service: this
    }
  ];

  //@ts-ignore
  private flex: IProperty[] = [
    {
      name: "position",
      type: "list",
      values: ["static", "relative", "absolute"],
      service: this
    }, {
      name: "display",
      type: "list",
      values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"],
      service: this
    }, {
      name: "flex-direction",
      type: "list",
      values: ["row", "row-reverse", "column", "column-reverse"],
      service: this
    }, {
      name: "flex-wrap",
      type: "list",
      values: ["nowrap", "wrap", "warp-reverse"],
      service: this
    }, {
      name: "justify-self",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "justify-items",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "justify-content",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "align-self",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "align-items",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "align-content",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "flex",
      type: "string",
      default: "0 1 auto",
      service: this
    }
  ];

  //@ts-ignore
  private grid: IProperty[] = [
    {
      name: "position",
      type: "list",
      values: ["static", "relative", "absolute"],
      service: this
    }, {
      name: "display",
      type: "list",
      values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"],
      service: this
    }, {
      name: "flex-direction",
      type: "list",
      values: ["row", "row-reverse", "column", "column-reverse"],
      service: this
    }, {
      name: "flex-wrap",
      type: "list",
      values: ["nowrap", "wrap", "warp-reverse"],
      service: this
    }, {
      name: "justify-self",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "justify-items",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "justify-content",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "align-self",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "align-items",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "align-content",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "flex",
      type: "string",
      default: "0 1 auto",
      service: this
    }
  ];

  name: 'flex' | 'styles' | 'grid';

  constructor(name: 'flex' | 'styles' | 'grid') {
    this.name = name;
  }

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    return this[this.name];
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    for (let d of designItems) {
      d.setStyle(<keyof CSSStyleDeclaration>property.name, value);
    }
  }

  isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0)
      designItems.forEach((x) => {
        let has = x.styles.has(property.name);
        all = all && has;
        some = some || has;
      });
    else
      return ValueType.none

    return all ? ValueType.all : some ? ValueType.some : ValueType.none;
  }

  getValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems != null && designItems.length !== 0) {
      let lastValue = designItems[0].styles.get(property.name);
      for (const x of designItems) {
        let value = x.styles.get(property.name);
        if (value != lastValue) {
          lastValue = null;
          break;
        }
      }
      return lastValue;
    }
    return null;
  }

  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return null;
    //return window.getComputedStyle(designItem.element)[property.name]; //todo cache the computed style per design item when selction changes
  }
}
