import { IContentService } from './IContentService';
import { IContentChanged } from './IContentChanged';
import { TypedEvent } from '../../../basic/TypedEvent';

export class ContentService implements IContentService {
   readonly onContentChanged = new TypedEvent<IContentChanged>();
}