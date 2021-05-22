import { IDesignItem } from '../../item/IDesignItem';
import { IHtmlWriterOptions } from './IHtmlWriterOptions';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter';
import { IStringPosition } from './IStringPosition';

export interface IHtmlWriterService {
  canWrite(designItem:IDesignItem) : boolean;
  write(indentedTextWriter : IndentedTextWriter, designItem: IDesignItem, options: IHtmlWriterOptions, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>);
}