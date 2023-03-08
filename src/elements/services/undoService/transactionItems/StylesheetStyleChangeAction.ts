import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IStyleDeclaration, IStylesheetService } from '../../stylesheetService/IStylesheetService.js';

export class StylesheetStyleChangeAction implements ITransactionItem {

  private stylesheetService: IStylesheetService
  private declaration: IStyleDeclaration;

  constructor(stylesheetService: IStylesheetService, declaration: IStyleDeclaration, newValue: any, oldValue: any) {
    this.title = "Change Css Style " + declaration.name + " to " + newValue;

    this.stylesheetService = stylesheetService;
    this.declaration = declaration;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [];
  }

  undo() {
    this.stylesheetService.updateDeclarationValueWithoutUndo(this.declaration, this.oldValue, false);
  }

  do() {
    this.stylesheetService.updateDeclarationValueWithoutUndo(this.declaration, this.newValue, false);
  }

  public designItem: IDesignItem;
  public name: string;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    return false;
  }
}