import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class CssStyleChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, name: string, newValue: any, oldValue: any, newImportant: boolean = false, oldImportant: boolean = false) {
    this.title = "Change Css Style " + name + " of &lt;" + designItem.name + "&gt;";

    this.designItem = designItem;
    this.name = name;
    this.newValue = newValue;
    this.oldValue = oldValue;
    this.newImportant = newImportant;
    this.oldImportant = oldImportant;
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
      this.designItem._withoutUndoSetStyle(<string>this.name, this.oldValue, this.oldImportant);
      (<ElementCSSInlineStyle><unknown>this.designItem.element).style.setProperty(<string>this.name, this.oldValue, this.oldImportant ? 'important' : '');
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
      this.designItem._withoutUndoSetStyle(<string>this.name, this.newValue, this.newImportant);
      (<ElementCSSInlineStyle><unknown>this.designItem.element).style.setProperty(<string>this.name, this.newValue, this.newImportant ? 'important' : '');
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'css', name: this.name, oldValue: this.oldValue, newValue: this.newValue }];
    }
  }

  public designItem: IDesignItem;
  public name: string;
  public newValue: any;
  public oldValue: any;
  public newImportant: boolean;
  public oldImportant: boolean;

  mergeWith(other: ITransactionItem) {
    return false
  }
}
