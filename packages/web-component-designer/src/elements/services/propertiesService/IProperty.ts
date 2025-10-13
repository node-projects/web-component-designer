import { IPropertiesService } from './IPropertiesService.js';
import { IPropertyEditor } from './IPropertyEditor.js';
import { PropertyType } from './PropertyType.js';

export interface IProperty {
  name: string;
  renamable?: boolean;
  propertyName?: string; // normaly camelCased name of property
  attributeName?: string; // normaly dash seperated name of property
  description?: string;
  type?: 'addNew' | 'json' | 'color' | 'date' | 'number' | 'list' | 'enum' | 'boolean' | 'img-lis' | 'thickness' | 'css-length' | 'string' | string; // -> string, number, list, color, thickness, css-length
  default?: any; //what was this for? remove???
  min?: number;
  max?: number;
  step?: number;
  readonly?: boolean;
  values?: string[]; // list selectable values
  enumValues?: [name: string, value: string | number][]; // list selectable enum values
  createEditor?: (property: IProperty) => IPropertyEditor;
  value?: any;
  service: IPropertiesService;
  defaultValue?: any;
  example?: string;
  propertyType: PropertyType; // => needed for pg-grid. for example property only types can only be used for binding, css property types could never bind two way...
}