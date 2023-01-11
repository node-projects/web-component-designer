import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";

export interface IStyleRule {
    selectors: string[];
    declarations: IStyleDeclaration[];
    specificity: number;
}

export interface IStyleDeclaration {
    name: string;
    value: string;
    important: boolean;
    specificity: number;
}

export interface IStylesheet {
    stylesheet: string,
    name: string,
}

export interface IStylesheetService {
    getAppliedRules(designItem: IDesignItem, property: IProperty): IStyleRule[];
    getDeclarations(designItem: IDesignItem, property: IProperty): IStyleDeclaration[];
    // updateDefiningRule(designItem: IDesignItem, property: IProperty, value: string): boolean;
    setOrUpdateDeclaration(designItem: IDesignItem, property: IProperty, value: string): boolean
    stylesheetChanged: TypedEvent<{ stylesheet: IStylesheet }>;
}