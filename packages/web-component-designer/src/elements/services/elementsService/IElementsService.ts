import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IService } from '../IService.js';
import { IElementDefinition } from './IElementDefinition.js';

export interface IElementsService extends IService {
    readonly name: string
    /** Optional event emitted when the available element definitions changed and palette views should reload this service. */
    readonly onElementsChanged?: TypedEvent<void>
    getElements(): Promise<IElementDefinition[]>
}
