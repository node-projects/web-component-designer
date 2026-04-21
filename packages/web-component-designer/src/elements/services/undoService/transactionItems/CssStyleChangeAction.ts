import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class CssStyleChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, name: string, newValue: any, oldValue: any) {
    this.title = "Change Css Style " + name + " of &lt;" + designItem.name + "&gt;";

    this.designItem = designItem;
    this.name = name;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo(): IContentChanged[] | null {
    if (this.oldValue === '' || this.oldValue == null) {
      this.designItem._withoutUndoRemoveStyle(<string>this.name);
      if ((<string>this.name).startsWith('--')) {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style.removeProperty(<string>this.name);
      } else {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = '';
      }
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'css', name: this.name, oldValue: this.newValue, newValue: null }];
    } else {
      this.designItem._withoutUndoSetStyle(<string>this.name, this.oldValue);
      if ((<string>this.name).startsWith('--')) {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style.setProperty(<string>this.name, this.oldValue);
      } else {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = this.oldValue;
      }
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'css', name: this.name, oldValue: this.newValue, newValue: this.oldValue }];
    }
  }
  do(): IContentChanged[] | null {
    if (this.newValue === '' || this.newValue == null) {
      this.designItem._withoutUndoRemoveStyle(<string>this.name);
      if ((<string>this.name).startsWith('--')) {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style.removeProperty(<string>this.name);
      } else {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = '';
      }
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'css', name: this.name, oldValue: this.oldValue, newValue: null }];
    } else {
      this.designItem._withoutUndoSetStyle(<string>this.name, this.newValue);
      if ((<string>this.name).startsWith('--')) {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style.setProperty(<string>this.name, this.newValue);
      } else {
        (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = this.newValue;
      }
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'css', name: this.name, oldValue: this.oldValue, newValue: this.newValue }];
    }
  }

  public designItem: IDesignItem;
  public name: string;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    return false
  }
}