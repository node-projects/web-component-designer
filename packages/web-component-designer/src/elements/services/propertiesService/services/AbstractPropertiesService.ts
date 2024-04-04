import { IPropertiesService, RefreshMode } from '../IPropertiesService.js';
import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { ValueType } from '../ValueType.js';
import { PropertiesHelper } from './PropertiesHelper.js';
import { BindingTarget } from '../../../item/BindingTarget.js';
import { IBinding } from '../../../item/IBinding.js';
import { PropertyType } from '../PropertyType.js';
import { NodeType } from '../../../item/NodeType.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { newElementFromString } from '../../../helper/ElementHelper.js';

export abstract class AbstractPropertiesService implements IPropertiesService {

  constructor(recreateElementsOnPropertyChange?: boolean) {
    this._recreateElementsOnPropertyChange = recreateElementsOnPropertyChange;
  }

  protected _recreateElementsOnPropertyChange: boolean = false;

  private static _stylesCache = new Map<IDesignItem, Set<string>>;
  private _cssCacheClearTimer: NodeJS.Timeout;
  private static _bindingsCache = new Map<IDesignItem, IBinding[]>;
  private static _bindingsCacheClearTimer: NodeJS.Timeout;

  abstract getRefreshMode(designItem: IDesignItem): RefreshMode;

  abstract isHandledElement(designItem: IDesignItem): boolean;

  protected _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    let properties = this.getProperties(designItem);
    if ('properties' in properties[0]) {
      return (<IPropertyGroup[]>properties).flatMap(x => x.properties).find(x => x.name == name);
    }
    else
      return (<IProperty[]>properties).find(x => x.name == name);
  }

  abstract getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[];

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const cg = designItems[0].openGroup("property changed: " + property.name + " to " + value);
    for (let d of designItems) {
      if (!this.isHandledElement(d))
        continue;
      if (!this.getProperty(d, property.name))
        continue;

      if (property.propertyType == PropertyType.cssValue) {
        d.updateStyleInSheetOrLocal(property.name, value);
        //unkown css property names do not trigger the mutation observer of property grid, 
        //fixed by assinging stle again to the attribute
        (<HTMLElement>d.element).setAttribute('style', (<HTMLElement>d.element).getAttribute('style'));
      } else {
        let attributeName = property.attributeName
        if (!attributeName)
          attributeName = PropertiesHelper.camelToDashCase(property.name);


        if (property.type === 'object') {
          const json = JSON.stringify(value);
          if (property.propertyType == PropertyType.attribute || property.propertyType == PropertyType.propertyAndAttribute)
            d.setAttribute(attributeName, json);
          if (property.propertyType == PropertyType.property || property.propertyType == PropertyType.propertyAndAttribute)
            d.element[property.name] = value;
        } else if (property.type == 'boolean' && (value === false || value == null)) {
          if (property.propertyType == PropertyType.attribute || property.propertyType == PropertyType.propertyAndAttribute)
            d.removeAttribute(attributeName);
          if (property.propertyType == PropertyType.property || property.propertyType == PropertyType.propertyAndAttribute)
            d.element[property.name] = false;
        }
        else if (property.type == 'boolean' && value === true) {
          if (property.propertyType == PropertyType.attribute || property.propertyType == PropertyType.propertyAndAttribute)
            d.setAttribute(attributeName, "");
          if (property.propertyType == PropertyType.property || property.propertyType == PropertyType.propertyAndAttribute)
            d.element[property.name] = true;
        }
        else {
          if (property.propertyType == PropertyType.attribute || property.propertyType == PropertyType.propertyAndAttribute)
            d.setAttribute(attributeName, value.toString());
          if (property.propertyType == PropertyType.property || property.propertyType == PropertyType.propertyAndAttribute)
            d.element[property.name] = value;
        }
      }
      this._notifyChangedProperty(d, property, value);
    }
    cg.commit();
    if (this._recreateElementsOnPropertyChange)
      AbstractPropertiesService.recreateElements(this, designItems);
  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    if (property.propertyType == PropertyType.attribute)
      return BindingTarget.attribute;
    if (property.propertyType == PropertyType.cssValue)
      return BindingTarget.css;
    return BindingTarget.property;
  }

  clearValue(designItems: IDesignItem[], property: IProperty, clearType: 'all' | 'binding' | 'value') {
    const cg = designItems[0].openGroup("property cleared: " + property.name);
    for (let d of designItems) {
      if (clearType != 'binding') {
        if (property.propertyType == PropertyType.cssValue) {
          d.removeStyle(property.name);
        } else {
          let attributeName = property.attributeName
          if (!attributeName)
            attributeName = PropertiesHelper.camelToDashCase(property.name);
          d.removeAttribute(attributeName);
        }
      }
      if (clearType != 'value') {
        d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
          return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
        });
      }
      this._notifyChangedProperty(d, property, undefined);
    }
    cg.commit();
    if (this._recreateElementsOnPropertyChange)
      AbstractPropertiesService.recreateElements(this, designItems);
  }

  isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0) {
      let attributeName = property.attributeName
      if (!attributeName)
        attributeName = PropertiesHelper.camelToDashCase(property.name);
      for (let x of designItems) {
        let has = false;
        if (property.propertyType == PropertyType.cssValue)
          has = x.hasStyle(property.name);
        else
          has = x.hasAttribute(attributeName);
        all = all && has;
        some = some || has;
        if (!all && some)
          break;
      };

      const bindings = AbstractPropertiesService.getOrBuildCachedBindings(designItems[0]);
      if (property.propertyType == PropertyType.cssValue) {
        if (bindings && bindings.find(x => (x.target == BindingTarget.css || x.target == BindingTarget.cssvar) && x.targetName == property.name))
          return ValueType.bound;
      } else {
        if (property.propertyType == PropertyType.attribute) {
          if (bindings && bindings.find(x => x.target == BindingTarget.attribute && x.targetName == property.name))
            return ValueType.bound;
        } else if (property.propertyType == PropertyType.property) {
          if (bindings && bindings.find(x => x.target == BindingTarget.property && x.targetName == property.name))
            return ValueType.bound;
        } else {
          if (bindings && bindings.find(x => (x.target == BindingTarget.property || x.target == BindingTarget.attribute) && x.targetName == property.name))
            return ValueType.bound;
        }
      }

      if (!all && property.propertyType == PropertyType.cssValue) {
        let styles = AbstractPropertiesService._stylesCache.get(designItems[0]);
        if (!styles) {
          styles = new Set(designItems[0].getAllStyles().filter(x => x.selector != null).flatMap(x => x.declarations).map(x => x.name));
          AbstractPropertiesService._stylesCache.set(designItems[0], styles);
          clearTimeout(this._cssCacheClearTimer);
          this._cssCacheClearTimer = setTimeout(() => AbstractPropertiesService._stylesCache.clear(), 30);
        }

        let cssValue = styles.has(property.name);
        if (cssValue)
          return ValueType.fromStylesheet;
      }
    }
    else
      return ValueType.none

    return all ? ValueType.all : some ? ValueType.some : ValueType.none;
  }

  static getOrBuildCachedBindings(designItem: IDesignItem) {
    let bindings = AbstractPropertiesService._bindingsCache.get(designItem);
    if (!bindings) {
      const services = designItem.serviceContainer.getServices('bindingService');
      bindings = [];
      for (const s of services) {
        const bs = s.getBindings(designItem);
        if (bs && bs.length > 0) {
          bindings.push(...bs);
        }
      }
      AbstractPropertiesService._bindingsCache.set(designItem, bindings);
      clearTimeout(this._bindingsCacheClearTimer);
      this._bindingsCacheClearTimer = setTimeout(() => AbstractPropertiesService._bindingsCache.clear(), 30);
    }
    return bindings;
  }

  getValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems != null && designItems.length !== 0) {
      if (property.propertyType == PropertyType.cssValue) {
        let lastValue = designItems[0].getStyle(property.name);
        for (const d of designItems) {
          let value = d.getStyle(property.name);
          if (value != lastValue) {
            lastValue = null;
            break;
          }
        }
        return lastValue;
      } else {
        let attributeName = property.attributeName
        if (!attributeName)
          attributeName = PropertiesHelper.camelToDashCase(property.name);

        if (property.type == 'boolean') {
          if (designItems[0].hasAttribute(attributeName)) {
            const val = designItems[0].getAttribute(attributeName);
            if (val == "")
              return true;
            return val;
          }
          return false;
        }
        let lastValue = designItems[0].getAttribute(attributeName);
        /*
        for (const x of designItems) {
          let value = x.attributes.get(attributeName);
          if (value != lastValue) {
            lastValue = null;
            break;
          }
        }
        */
        return lastValue;
      }
    }
    return null;
  }

  getBinding(designItems: IDesignItem[], property: IProperty): IBinding {
    const bindings = AbstractPropertiesService.getOrBuildCachedBindings(designItems[0]);
    if (bindings != null) {
      if (property.propertyType == PropertyType.cssValue) {
        return bindings.find(x => (x.target == BindingTarget.css || x.target == BindingTarget.cssvar) && x.targetName == property.name);
      } else {
        if (property.propertyType == PropertyType.attribute) {
          return bindings.find(x => x.target == BindingTarget.attribute && x.targetName == property.name);
        } else if (property.propertyType == PropertyType.property) {
          return bindings.find(x => x.target == BindingTarget.property && x.targetName == property.name);
        } else {
          return bindings.find(x => (x.target == BindingTarget.property || x.target == BindingTarget.attribute) && x.targetName == property.name);
        }
      }
    }
    return null;
  }

  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    if (property.propertyType == PropertyType.cssValue) {
      if (designItems != null && designItems.length !== 0) {
        if (designItems[0].nodeType == NodeType.Element) {
          let v = window.getComputedStyle(designItems[0].element)[property.name];
          return v;
        }
      }
      return null;
    }
    else
      return property.defaultValue;
  }

  protected static recreateElements(service: IPropertiesService, designItems: IDesignItem[]) {
    for (let d of designItems) {
      if (!service.isHandledElement(d))
        continue;

      let txt = '<' + d.name + ' ';
      for (let a of d.element.attributes) {
        txt += a.name + '="' + a.value.replaceAll('"', '&quot;') + '" ';
      }
      txt += '></' + d.name + '>';
      let element = newElementFromString(txt); // some custom elements only parse attributes during constructor call 
      for (let c of [...d.element.childNodes])
        element.appendChild(c);
      (<HTMLElement>element).style.pointerEvents = 'auto';
      (<HTMLElement>d.node).insertAdjacentElement('beforebegin', element);
      if (d.node.parentNode)
        (<HTMLElement>d.node.parentNode).removeChild(d.node);
      d.replaceNode(element);
    }
  }
}