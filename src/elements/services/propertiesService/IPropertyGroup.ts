import { IProperty } from './IProperty.js';

export interface IPropertyGroup {
  name: string;
  description?: string;
  properties: IProperty[]
}