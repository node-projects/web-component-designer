import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem";
import { IStyleDeclaration, IStyleRule, IStylesheet, IStylesheetService } from "./IStylesheetService";

export abstract class AbstractStylesheetService implements IStylesheetService {

    abstract setStylesheets(stylesheets: IStylesheet[]): void
    abstract getStylesheets(): IStylesheet[]
    abstract getAppliedRules(designItem: IDesignItem): IStyleRule[]
    abstract getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[]
    abstract updateDeclarationValue(declaration: IStyleDeclaration, value: string, important: boolean): boolean
    abstract insertDeclarationIntoRule(rule: IStyleRule, property: string, value: string, important: boolean): boolean
    abstract removeDeclarationFromRule(rule: IStyleRule, property: string): boolean;

    public stylesheetChanged: TypedEvent<{ stylesheet: IStylesheet; }> = new TypedEvent<{ stylesheet: IStylesheet; }>();
    public stylesheetsChanged: TypedEvent<void> = new TypedEvent<void>();

    protected elementMatchesASelector(designItem: IDesignItem, selectors: string[]) {
        for (const selector of selectors)
            if (designItem.element.matches(selector)) return true;
        return false;
    }
}