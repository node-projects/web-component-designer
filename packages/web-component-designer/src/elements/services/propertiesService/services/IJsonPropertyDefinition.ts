import { PropertyType } from '../PropertyType.js';

export interface IJsonPropertyDefinition {
  name: string;
  propertyName?: string,
  attributeName?: string
  description?: string;
  type?: string; // -> string, number, list, color, thickness, css numeric types
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  values?: string[]; // list selectable values
  units?: string[]; // selectable units for editors that support unit changes
  numericValueDecimalPlaces?: number; // rounding used by numeric unit conversions
  enumValues?: [name: string, value: string | number][]; // list selectable enum values
  value?: any;
  defaultValue?: any;
  propertyType?: PropertyType.cssValue
}