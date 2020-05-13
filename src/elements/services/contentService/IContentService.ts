import { TypedEvent } from '../../../basic/TypedEvent';
import { IContentChanged } from './IContentChanged';
import { IDesignItem } from '../../item/IDesignItem';

export interface IContentService {
    readonly onContentChanged: TypedEvent<IContentChanged>;
    readonly rootDesignItem: IDesignItem;
}