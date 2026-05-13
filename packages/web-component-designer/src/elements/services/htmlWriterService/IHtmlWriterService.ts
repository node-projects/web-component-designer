import { IDesignItem } from '../../item/IDesignItem.js';
import { ITextWriter } from '../../helper/ITextWriter.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';

export interface IHtmlWriterService {
  options: IHtmlWriterOptions;
  /**
   * Enables serializing the root design item when the designer has no child items.
   * Default HTML writers should leave this unset because root containers are usually
   * editor scaffolding, not document content. Text-based document writers can set it
   * to true when document-level metadata stored on the root item must still be written.
   */
  supportsRootItemWrite?: boolean;
  write(textWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, updatePositions?: boolean);
}
