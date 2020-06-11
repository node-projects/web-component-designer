import { BindingMode } from "./BindingMode";
import { BindingTarget } from "./BindingTarget";

export interface IBinding {
    bindableObjectNames?: string[];
    expression?:string;
    mode?: BindingMode;
    target?: BindingTarget;
    invert?: boolean;
    converter?: string;
    changedEvent?: string;
}