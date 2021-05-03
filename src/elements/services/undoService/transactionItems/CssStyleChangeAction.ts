import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';

export class CssStyleChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, name: keyof CSSStyleDeclaration, newValue: any, oldValue: any) {
    this.title = "Change CSS Style";

    this.designItem = designItem;
    this.name = name;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo() {
    if (this.oldValue === '' || this.oldValue == null) {
      this.designItem.styles.delete(<string>this.name);
      (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = ''
    } else {
      this.designItem.styles.set(<string>this.name, this.oldValue);
      (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = this.oldValue;
    }
  }
  do() {
    if (this.newValue === '' || this.newValue == null) {
      this.designItem.styles.delete(<string>this.name);
      (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = ''
    } else {
      this.designItem.styles.set(<string>this.name, this.newValue);
      (<ElementCSSInlineStyle><unknown>this.designItem.element).style[<string>this.name] = this.newValue;
    }
  }

  public designItem: IDesignItem;
  public name: keyof CSSStyleDeclaration;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    if (other instanceof CssStyleChangeAction && this.designItem === other.designItem && this.name === other.name) {
      this.newValue = other.newValue;
      return true;
    }
    return false
  }
}