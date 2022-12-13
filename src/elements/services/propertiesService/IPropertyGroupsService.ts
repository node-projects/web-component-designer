
import { IDesignItem } from '../../item/IDesignItem.js';
import { IPropertiesService } from './IPropertiesService.js';

export interface IPropertyGroupsService {
    getPropertygroups(designItems: IDesignItem[]): { name: string, propertiesService: IPropertiesService }[]
}