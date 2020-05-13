import { IContentService } from './IContentService';
import { IContentChanged } from './IContentChanged';
import { TypedEvent } from '../../../basic/TypedEvent';
import { IDesignItem } from '../../item/IDesignItem';

export class ContentService implements IContentService {

   constructor(rootElement: IDesignItem) {
      this.rootDesignItem = rootElement;
   }

   readonly rootDesignItem: IDesignItem;

   readonly onContentChanged = new TypedEvent<IContentChanged>();
}