import { IStylesheetService } from '../../stylesheetService/IStylesheetService.js';
import { ITransactionItem } from '../ITransactionItem.js';

export class StylesheetChangedAction implements ITransactionItem {

  private stylesheetService: IStylesheetService;

  constructor(stylesheetService: IStylesheetService, name: string, newValue: string, oldValue: string) {
    this.title = "Changed Css Stylesheet: " + name;

    this.stylesheetService = stylesheetService;
    this.name = name;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [];
  }

  undo() {
    this.stylesheetService.updateCompleteStylesheetWithoutUndo(this.name, this.oldValue);
  }

  do() {
    this.stylesheetService.updateCompleteStylesheetWithoutUndo(this.name, this.newValue);
  }

  public name: string;
  public newValue: string;
  public oldValue: string;

  mergeWith(other: ITransactionItem) { return false; }
}