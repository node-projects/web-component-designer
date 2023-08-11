import { IDesignItem } from '../../item/IDesignItem.js';
import { ITextWriter } from '../../helper/ITextWriter.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';

export interface IHtmlWriterService {
  options: IHtmlWriterOptions;
  write(textWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, updatePositions?: boolean);
}