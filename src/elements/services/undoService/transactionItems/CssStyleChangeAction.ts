import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';

export class CssStyleChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, name: keyof CSSStyleDeclaration, newValue: any) {
    this.title = "Change CSS Style";

    this.designItem = designItem;
    this.name = name;
    this.newValue = newValue;
    this.oldValue = (<ElementCSSInlineStyle><unknown>designItem.element).style[name];
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo() {
    (<ElementCSSInlineStyle><unknown>this.designItem.element).style[name] = this.oldValue;
  }

  do() {
    (<ElementCSSInlineStyle><unknown>this.designItem.element).style[name] = this.newValue;
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