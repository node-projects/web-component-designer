import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";

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
    content: string,
    name: string,
}

export interface IStylesheetService {
    setStylesheets(stylesheets: IStylesheet[]): void;
    getStylesheets(): IStylesheet[];
    getAppliedRules(designItem: IDesignItem): IStyleRule[];
    getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[];
    updateDeclarationWithDeclaration(declaration: IStyleDeclaration, value: string, important: boolean): boolean;
    insertDeclarationIntoRule(rule: IStyleRule, declaration: IStyleDeclaration, important: boolean): boolean;
    removeDeclarationFromRule(rule: IStyleRule, declaration: IStyleDeclaration): boolean;

    stylesheetChanged: TypedEvent<{ stylesheet: IStylesheet }>;
    stylesheetsChanged: TypedEvent<void>;
}