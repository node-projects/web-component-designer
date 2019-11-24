import { IContentService } from './IContentService';
import { IContentChanged } from './IContentChanged';
import { TypedEvent } from '../../../basic/TypedEvent';

export class ContentService implements IContentService {

   constructor(rootElement: Element) {
      this.rootElement = rootElement;
   }

   readonly rootElement: Element;

   readonly onContentChanged = new TypedEvent<IContentChanged>();
}