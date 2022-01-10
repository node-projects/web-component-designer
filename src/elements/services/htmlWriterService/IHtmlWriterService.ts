import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter.js';
import { IStringPosition } from './IStringPosition.js';

export interface IHtmlWriterService {
  write(indentedTextWriter: IndentedTextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, options: IHtmlWriterOptions, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>);
}