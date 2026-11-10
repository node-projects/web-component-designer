import { IProperty } from './IProperty.js';

export interface IPropertyGroup {
  name: string;
  description?: string;
  tooltip?: string;
  properties: IProperty[]
}