import { IProperty } from './IProperty.js';
import { IService } from '../IService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ValueType } from './ValueType.js';
import { BindingTarget } from '../../item/BindingTarget.js';
import { IBinding } from '../../item/IBinding.js';
import { IPropertyGroup } from './IPropertyGroup.js';

export enum RefreshMode {
  none,
  full,
  fullOnValueChange
}

export interface IPropertiesService extends IService {
  //readonly name: string;
  getRefreshMode(designItem: IDesignItem): RefreshMode;

  isHandledElement(designItem: IDesignItem): boolean;
  getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[];
  getProperty(designItem: IDesignItem, name: string): IProperty;
  getBinding(designItems: IDesignItem[], property: IProperty): IBinding
  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget;

  setValue(designItems: IDesignItem[], property: IProperty, value: any);
  clearValue(designItems: IDesignItem[], property: IProperty, clearType: 'all' | 'binding' | 'value');
  isSet(designItems: IDesignItem[], property: IProperty): ValueType;
  getValue(designItems: IDesignItem[], property: IProperty): any;
  getUnsetValue(designItems: IDesignItem[], property: IProperty): any;
}
