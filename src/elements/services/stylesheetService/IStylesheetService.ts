import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";

export interface IStyleRule {
    selector: string;
    declarations: IStyleDeclaration[];
    specificity: number;
}

export interface IStyleDeclaration {
    name: string;
    value: string;
    important: boolean;
}
export interface IStylesheetService {
    getAppliedRules(designItem: IDesignItem, property: IProperty): IStyleRule[];
    getDeclarations(designItem: IDesignItem, property: IProperty): IStyleDeclaration[];
    updateDefiningRule(designItem: IDesignItem, property: IProperty, value: string): boolean;
    stylesheetChanged: TypedEvent<{ stylesheet: string }>;
}