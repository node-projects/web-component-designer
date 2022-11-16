import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { ITextWriter } from '../../helper/ITextWriter.js';
import { IStringPosition } from './IStringPosition.js';

export interface IHtmlWriterService {
  write(textWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, options: IHtmlWriterOptions, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>);
}