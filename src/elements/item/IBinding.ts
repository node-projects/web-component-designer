import { BindingMode } from "./BindingMode";
import { BindingTarget } from "./BindingTarget";

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
  //converter?: string;
  changedEvents?: string[];
  nullSafe?: boolean;
}