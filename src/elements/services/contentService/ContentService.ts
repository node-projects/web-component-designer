import { IContentService } from './IContentService';
import { IContentChanged } from './IContentChanged'
import { IDesignItem } from '../../item/IDesignItem';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export class ContentService implements IContentService {

   constructor(rootElement: IDesignItem) {
      this.rootDesignItem = rootElement;
   }

   readonly rootDesignItem: IDesignItem;

   readonly onContentChanged = new TypedEvent<IContentChanged>();
}