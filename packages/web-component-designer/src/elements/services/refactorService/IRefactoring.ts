import { BindingTarget } from "../../item/BindingTarget.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IRefactorService } from "./IRefactorService.js";

export interface IRefactoring {
    service: IRefactorService;
    name: string; //wert der 
    itemType: string; //for example: text, bindableObject, screen, ....
    designItem: IDesignItem;
    type: 'binding' | 'script' | 'content' | 'attribute';
    display?: string;
    sourceObject: any;
    target?: BindingTarget;
    targetName?: string;

    //usage?: string; //spezieller typ? bspw. css, attribute, script, binding
    //dynamicType?: string; //bein wincc, direkte variable, script, ...
}