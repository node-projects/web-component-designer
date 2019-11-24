import { TypedEvent } from '../../../basic/TypedEvent';
import { IContentChanged } from './IContentChanged';

export interface IContentService {
    readonly onContentChanged: TypedEvent<IContentChanged>;
    readonly rootElement: Element;
}