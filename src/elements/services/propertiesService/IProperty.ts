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
  enumValues?: [name: string, value: string|number][]; // list selectable enum values
  createEditor?: (property: IProperty) => IPropertyEditor;
  value?: any;
  service: IPropertiesService;
  defaultValue?: any;
}