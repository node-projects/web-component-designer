import { PropertyType } from "../PropertyType";

export interface IJsonPropertyDefinition {
  name: string;
  propertyName?: string,
  attributeName?: string
  description?: string;
  type?: string; // -> string, number, list, color, thickness, css-length
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  values?: string[]; // list selectable values
  enumValues?: [name: string, value: string | number][]; // list selectable enum values
  value?: any;
  defaultValue?: any;
  propertyType?: PropertyType.cssValue
}