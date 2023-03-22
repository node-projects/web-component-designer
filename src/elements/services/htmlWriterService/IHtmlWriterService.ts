import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { ITextWriter } from '../../helper/ITextWriter.js';

export interface IHtmlWriterService {
  write(textWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, options: IHtmlWriterOptions, updatePositions?: boolean);
}