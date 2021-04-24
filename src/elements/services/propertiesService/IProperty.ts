import { IPropertiesService } from './IPropertiesService';
import { IPropertyEditor } from './IPropertyEditor';

export interface IProperty {
  name: string;
  type?: string; // -> string, number, list, color, thickness, css-length
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  values?: string[]; // list selectable values
  createEditor?: (property: IProperty) => IPropertyEditor;
  value?: any;
  service: IPropertiesService;
}