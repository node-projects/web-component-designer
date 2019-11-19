import { IProperty } from './IProperty';
import { IService } from '../IService';
import { IDesignItem } from '../../item/IDesignItem';

export interface IPropertiesService extends IService {
    readonly name: string;
    isHandledElement(designItem: IDesignItem): boolean;
    getProperties(designItem: IDesignItem): IProperty[];
    setValue(designItem: IDesignItem, property: IProperty, value: any);
    getValue(designItem: IDesignItem, property: IProperty);
}
