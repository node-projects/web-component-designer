import { IContentChanged } from './IContentChanged.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export interface IContentService {
    readonly onContentChanged: TypedEvent<IContentChanged>;
    readonly rootDesignItem: IDesignItem;
}