import { IPropertiesService } from './IPropertiesService';
import { IPropertyEditor } from './IPropertyEditor';
import { PropertyType } from './PropertyType';

export interface IProperty {
  name: string;
  propertyName?: string;// normaly camelCased name of property
  attributeName?: string; // normaly dash seperated name of property
  description?: string;
  type?: 'addNew' | 'json' | 'color' | 'date' | 'number' | 'list' | 'enum' | 'boolean' | 'img-lis' | 'thickness' | 'css-length' | 'string' | string; // -> string, number, list, color, thickness, css-length
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  values?: string[]; // list selectable values
  enumValues?: [name: string, value: string | number][]; // list selectable enum values
  createEditor?: (property: IProperty) => IPropertyEditor;
  value?: any;
  service: IPropertiesService;
  defaultValue?: any;
  propertyType: PropertyType // => needed for pg-grid. for example property only types can only be used for binding, css property types could never bind two way...
}