import { IPropertiesService } from './IPropertiesService.js';
import { IPropertyEditor } from './IPropertyEditor.js';
import { PropertyType } from './PropertyType.js';
import type { IDesignItem } from '../../item/IDesignItem.js';

export interface IProperty {
  name: string;
  renamable?: boolean;
  displayName?: string; // nused in property grid
  propertyName?: string; // normaly camelCased name of property (also used for css properties)
  group?: string;
  attributeName?: string; // normaly dash seperated name of property
  description?: string;
  type?: 'addNew' | 'json' | 'color' | 'date' | 'number' | 'list' | 'enum' | 'boolean' | 'img-lis' | 'thickness' | 'css-length' | 'length' | 'angle' | 'time' | 'frequency' | 'flex' | 'resolution' | 'string' | string; // -> string, number, list, color, thickness, css numeric types
  default?: any; //what was this for? remove???
  min?: number;
  max?: number;
  step?: number;
  readonly?: boolean;
  values?: string[]; // list selectable values
  units?: string[]; // selectable units for editors that support unit changes
  unitSteps?: Record<string, number>;
  numericValueDecimalPlaces?: number; // rounding used by numeric unit conversions
  numericValueConverter?: (value: number, fromUnit: string, toUnit: string, property: IProperty, numericType: string, numberText?: string, rawValue?: string, designItems?: IDesignItem[]) => string | number | null | undefined;
  enumValues?: [name: string, value: string | number][]; // list selectable enum values
  createEditor?: (property: IProperty) => IPropertyEditor;
  value?: any;
  service: IPropertiesService;
  defaultValue?: any;
  example?: string;
  propertyType: PropertyType; // => needed for pg-grid. for example property only types can only be used for binding, css property types could never bind two way...
}