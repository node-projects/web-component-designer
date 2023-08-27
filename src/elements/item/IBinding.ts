import { BindingMode } from './BindingMode.js';
import { BindingTarget } from './BindingTarget.js';

export interface IBinding {
  targetName?: string; //Name of Attribute, CSS-Property, Event, ...
  target?: BindingTarget;
  rawName?: string; //raw attribute name (if it's an attribute)
  rawValue?: string; //raw attribute value (or element html)

  type?: string //here a name wich the bindings Service recognizes....

  expression?: string;  //the Binding internal Code
  bindableObjectNames?: string[]; 

  mode?: BindingMode;

  invert?: boolean;
  changedEvents?: string[];
  nullSafe?: boolean;
}