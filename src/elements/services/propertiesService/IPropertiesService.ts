import { IProperty } from './IProperty';
import { IService } from '../IService';
import { IDesignItem } from '../../item/IDesignItem';
import { ValueType } from './ValueType';

export interface IPropertiesService extends IService {
  readonly name: string;
  isHandledElement(designItem: IDesignItem): boolean;
  getProperties(designItem: IDesignItem): IProperty[];

  setValue(designItems: IDesignItem[], property: IProperty, value: any);
  isSet(designItems: IDesignItem[], property: IProperty): ValueType;
  getValue(designItems: IDesignItem[], property: IProperty): any;
  getUnsetValue(designItems: IDesignItem[], property: IProperty): any;
}
