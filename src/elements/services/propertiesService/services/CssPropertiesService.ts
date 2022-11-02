import { IPropertiesService } from '../IPropertiesService';
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from '../ValueType';
import { NodeType } from '../../../item/NodeType';
import { BindingTarget } from '../../../item/BindingTarget.js';
import { PropertyType } from '../PropertyType';
import { IBinding } from '../../../item/IBinding';

export class CssPropertiesService implements IPropertiesService {

  public listNeedsRefresh(designItem: IDesignItem): boolean {
    return this.name == 'styles' ? true : false;
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

  name: 'styles' | 'layout' | 'grid' | 'flex';

  constructor(name: 'styles' | 'layout' | 'grid' | 'flex') {
    this.name = name;
  }

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    if (this.name == 'styles') {
      return { name: name, type: 'string', service: this, propertyType: PropertyType.cssValue };
    }
    return this[this.name][name]
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    if (this.name == 'styles') {
      if (!designItem)
        return [];
      let arr = Array.from(designItem.styles.keys(), x => ({ name: x, type: 'string', service: this, propertyType: PropertyType.cssValue }));
      arr.push({ name: '', type: 'addNew', service: this, propertyType: PropertyType.complex });
      return arr;
    }
    return this[this.name];
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const cg = designItems[0].openGroup("properties changed");
    for (let d of designItems) {
      d.styles.set(property.name, value);
      (<HTMLElement>d.element).style[property.name] = value;
    }
    cg.commit();
  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.css;
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.styles.delete(property.name);
      (<HTMLElement>d.element).style[property.name] = '';
      d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
      });
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

  getBinding(designItems: IDesignItem[], property: IProperty): IBinding {
    //TODO: optimize perf, do not call bindings service for each property. 
    const bindings = designItems[0].serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
      return s.getBindings(designItems[0]);
    });
    return bindings.find(x => (x.target == BindingTarget.css) && x.targetName == property.name);
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
