import { IContentChanged } from './IContentChanged';
import { IDesignItem } from '../../item/IDesignItem';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export interface IContentService {
    readonly onContentChanged: TypedEvent<IContentChanged>;
    readonly rootDesignItem: IDesignItem;
}