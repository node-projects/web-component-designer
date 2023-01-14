import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";

export interface IStyleRule {
    selector: string;
    declarations: IStyleDeclaration[];
    specificity: number;
    stylesheetName?: string;
}

export interface IStyleDeclaration {
    name: string;
    value: string;
    important: boolean;
}

export interface IStylesheet {
    stylesheet: string,
    name: string,
}

export interface IStylesheetService {
    setStylesheets(stylesheets: IStylesheet[])
    getStylesheets(): IStylesheet[];
    getAppliedRules(designItem: IDesignItem): IStyleRule[];
    getDeclarations(designItem: IDesignItem, property: IProperty): IStyleDeclaration[];
    updateDeclarationWithProperty(designItem: IDesignItem, property: IProperty, value: string, important: boolean): boolean;
    updateDeclarationWithDeclaration(declaration: IStyleDeclaration, value: string, important: boolean): boolean;
    
    stylesheetChanged: TypedEvent<{ stylesheet: IStylesheet }>;
    stylesheetsChanged: TypedEvent<void>;
}