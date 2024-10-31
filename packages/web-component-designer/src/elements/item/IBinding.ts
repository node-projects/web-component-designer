import { IBindingService } from '../services/bindingsService/IBindingService.js';
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

  bindableObjectNames?: string[];      //TODO: deprecate and remove
  bindableObjects?: IBindableObject[]; //if a name is not enough, use this list

  converters?: any

  mode?: BindingMode;

  invert?: boolean;
  changedEvents?: string[];
  nullSafe?: boolean;
  service: IBindingService;
}

export interface IBindableObject {   //e.g.   aa:$uservalue.0.name
  name?: string;                  //uservalue.0.name
  alias?: string;                 //aa
  modificator?: string;           //$
}