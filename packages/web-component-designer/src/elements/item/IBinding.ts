import { BindingMode } from './BindingMode.js';
import { BindingTarget } from './BindingTarget.js';

export interface IBinding {
  targetName?: string; //Name of Attribute, CSS-Property, Event, ...
  target?: BindingTarget;
  rawName?: string; //raw attribute name (if it's an attribute)
  rawValue?: string; //raw attribute value (or element html)

  type?: string //here a name wich the bindings Service recognizes....

  expression?: string;  //the bindings expression
  expressionTwoWay?: string;  //a expression wich is used for write back
  bindableObjectNames?: string[]; 
  converters?: any

  mode?: BindingMode;

  invert?: boolean;
  changedEvents?: string[];
  nullSafe?: boolean;
}