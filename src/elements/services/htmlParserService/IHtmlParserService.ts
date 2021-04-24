import { IService } from '../IService';
import type { ServiceContainer } from '../ServiceContainer';
import type { InstanceServiceContainer } from '../InstanceServiceContainer';
import { IDesignItem } from '../../item/IDesignItem';

export interface IHtmlParserService extends IService {
  parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]>
}