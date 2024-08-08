import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";
import { Specificity } from "./SpecificityCalculator.js";

export interface IStyleRule {
    selector: string;
    declarations: IStyleDeclaration[];
    specificity: Specificity;
    stylesheetName?: string;
    stylesheet: IStylesheet;
}

export interface IStyleDeclaration {
    name: string;
    value: string;
    important: boolean;
    parent: IStyleRule;
    stylesheet?: IStylesheet;
}

export interface IStylesheet {
    content: string;
    name: string;
    readOnly?: boolean;
}

export interface IDocumentStylesheet extends IStylesheet {
    designItem: IDesignItem;
}

export interface IStylesheetService {
    setStylesheets(stylesheets: IStylesheet[]): Promise<void>;
    getStylesheets(): IStylesheet[];

    getRules(selector: string): IStyleRule[];

    setDocumentStylesheets(stylesheets: IDocumentStylesheet[]): Promise<void>;

    getAppliedRules(designItem: IDesignItem): IStyleRule[];
    getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[];
    getDeclarationsSortedBySpecificity(designItem: IDesignItem, styleName: string): IStyleDeclaration[];

    updateDeclarationValue(declaration: IStyleDeclaration, value: string, important: boolean);
    updateDeclarationValueWithoutUndo(declaration: IStyleDeclaration, value: string, important: boolean)
    insertDeclarationIntoRule(rule: IStyleRule, property: string, value: string, important: boolean): boolean;
    removeDeclarationFromRule(rule: IStyleRule, property: string): boolean;
    updateCompleteStylesheet(name: string, newStyle: string): Promise<void>;
    updateCompleteStylesheetWithoutUndo(name: string, newStyle: string): Promise<void>;
    addRule(stylesheet: IStylesheet, selector: string): Promise<IStyleRule>;

    stylesheetChanged: TypedEvent<{ name: string, newStyle: string, oldStyle: string, changeSource: 'extern' | 'styleupdate' | 'undo' }>;
    stylesheetsChanged: TypedEvent<void>;
}