import { IService } from '../IService.js';
import type { ServiceContainer } from '../ServiceContainer.js';
import type { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IDesignItem } from '../../item/IDesignItem.js';

export interface IHtmlParserService extends IService {
  parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean, positionOffset?: Number): Promise<IDesignItem[]>
}