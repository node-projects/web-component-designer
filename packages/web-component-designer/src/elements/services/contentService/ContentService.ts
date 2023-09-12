import { IContentService } from './IContentService.js';
import { IContentChanged } from './IContentChanged'
import { IDesignItem } from '../../item/IDesignItem.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export class ContentService implements IContentService {

   constructor(rootElement: IDesignItem) {
      this.rootDesignItem = rootElement;
   }

   readonly rootDesignItem: IDesignItem;

   readonly onContentChanged = new TypedEvent<IContentChanged>();
}