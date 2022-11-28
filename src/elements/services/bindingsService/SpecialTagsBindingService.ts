import { IDesignItem } from "../../item/IDesignItem";
import { IBinding } from "../../item/IBinding";
import { IBindingService } from "./IBindingService";
import { BindingTarget } from "../../item/BindingTarget.js";
import { BindingMode } from "../../item/BindingMode.js";


/* Service wich read binings from special HTMl elements -> like tag-binding */
//TODO: refactor so we could use it
export class SpecialTagsBindingService implements IBindingService {

  public static type = 'visu-tagbinding-binding'

  _bindingTagName: string = "visu-tagbinding";
  _elementIdAttribute: string = "elemnt-id";
  _propertyNameAttribute: string = "property";
  _isStyleNameAttribute: string = "is-style";

  constructor() {
  }

  getBindings(designItem: IDesignItem): IBinding[] {
    const bindings = [];
    const directBindings = designItem.element.querySelectorAll(':scope > ' + this._bindingTagName);
    for (let b of directBindings) {
      bindings.push(this._parseBindingElement(b));
    }

    if (designItem.id) {
      const nameBindings = designItem.instanceServiceContainer.contentService.rootDesignItem.element.querySelectorAll(this._bindingTagName + "[" + this._elementIdAttribute + "='" + designItem.id + "]");
      for (let b of nameBindings) {
        const bnd = this._parseBindingElement(b);
        (<any>bnd).targetId = designItem.id
        bindings.push(bnd);
      }
    }

    return null;
  }

  private _parseBindingElement(b: Element): IBinding {
    let bnd: IBinding = { targetName: b.getAttribute(this._propertyNameAttribute) }
    bnd.target = b.hasAttribute(this._isStyleNameAttribute) ? BindingTarget.css : BindingTarget.property;
    bnd.invert = b.hasAttribute('negative-logic');
    bnd.rawValue = b.outerHTML;
    bnd.type = SpecialTagsBindingService.type;
    bnd.mode = b.hasAttribute('two-way') ? BindingMode.twoWay : BindingMode.oneWay;
    return bnd;
  }

  setBinding(designItem: IDesignItem, binding: IBinding): boolean {
    return true;
  }

  clearBinding(designItem: IDesignItem, propertyName: string, propertyTarget: BindingTarget): boolean {
    return true;
  }
}