import { IDesignItem } from "../../item/IDesignItem.js";
import { IRefactorService } from "./IRefactorService.js";

export interface IRefactoring {
    service: IRefactorService;
    name: string; //wert der 
    designItem: IDesignItem;
    type: 'binding'|'script';
    display?: string;
    sourceObject: any;

    //usage?: string; //spezieller typ? bspw. css, attribute, script, binding
    //dynamicType?: string; //bein wincc, direkte variable, script, ...
}