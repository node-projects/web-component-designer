import { IPropertiesService } from '../IPropertiesService';
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from '../ValueType';
import { NodeType } from '../../../item/NodeType';
import { BindingTarget } from '../../../item/BindingTarget.js';

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
      max: 1,
      step: 0.1,
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
    }, {
      name: "font-size",
      type: "css-length",
      service: this
    }, {
      name: "font-weight",
      type: "list",
      values: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900", "lighter", "bolder"],
      service: this
    }
  ];

  //@ts-ignore
  private alignment: IProperty[] = [
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
      name: "display",
      type: "list",
      values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"],
      service: this
    }, {
      name: "grid-template-columns",
      type: "string",
      service: this
    }, {
      name: "grid-template-rows",
      type: "string",
      service: this
    }, {
      name: "column-gap",
      type: "css-length",
      service: this
    }, {
      name: "row-gap",
      type: "css-length",
      service: this
    }, {
      name: "justify-content",
      type: "list",
      values: ["space-evenly", "space-around", "space-between", "center", "start", "end"],
      service: this
    }, {
      name: "align-content",
      type: "list",
      values: ["space-evenly", "space-around", "space-between", "center", "start", "end"],
      service: this
    }, {
      name: "justify-items",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }, {
      name: "align-items",
      type: "list",
      values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
      service: this
    }
  ];

  name: 'alignment' | 'styles' | 'grid';

  constructor(name: 'alignment' | 'styles' | 'grid') {
    this.name = name;
  }

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    return this[this.name][name]
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    return this[this.name];
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const cg = designItems[0].openGroup("properties changed", designItems);
    for (let d of designItems) {
      d.styles.set(property.name, value);
      (<HTMLElement>d.element).style[property.name] = value;
    }
    cg.commit();
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.styles.delete(property.name);
      (<HTMLElement>d.element).style[property.name] = '';
    }
  }

  isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0) {
      designItems.forEach((x) => {
        let has = x.styles.has(property.name);
        all = all && has;
        some = some || has;
      });
      //todo: optimize perf, do not call bindings service for each property. 
      const bindings = designItems[0].serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.getBindings(designItems[0]);
      });
      if (bindings && bindings.find(x => x.target == BindingTarget.css && x.targetName == property.name))
        return ValueType.bound;
    }
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

  //todo: optimize perf, call window.getComputedStyle only once per item, and not per property
  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems != null && designItems.length !== 0) {
      if (designItems[0].nodeType == NodeType.Element) {
        let v = window.getComputedStyle(designItems[0].element)[property.name];
        return v;
      }
    }
    return null;
  }
}
