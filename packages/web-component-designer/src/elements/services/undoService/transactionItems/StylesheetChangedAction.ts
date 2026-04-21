import { IContentChanged } from '../../InstanceServiceContainer.js';
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

  undo(): IContentChanged[] | null {
    this.stylesheetService.updateCompleteStylesheetWithoutUndo(this.name, this.oldValue);
    return null;
  }

  do(): IContentChanged[] | null {
    this.stylesheetService.updateCompleteStylesheetWithoutUndo(this.name, this.newValue);
    return null;
  }

  public name: string;
  public newValue: string;
  public oldValue: string;

  mergeWith(other: ITransactionItem) { return false; }
}