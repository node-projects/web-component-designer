import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";
import { IStyleDeclaration, IStyleRule, IStylesheet, IStylesheetService } from "./IStylesheetService.js";

import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import type { CssStylesheetAST } from "@adobe/css-tools";


export class CssToolsStylesheetService implements IStylesheetService {
    private _stylesheets = new Map<string, { stylesheet: IStylesheet, ast: CssStylesheetAST }>();
    stylesheetChanged: TypedEvent<{ stylesheet: IStylesheet; }> = new TypedEvent<{ stylesheet: IStylesheet; }>();
    stylesheetsChanged: TypedEvent<void> = new TypedEvent<void>();

    async setStylesheets(stylesheets: IStylesheet[]) {
        if (stylesheets != null) {
            let tools = await import('@adobe/css-tools');
            this._stylesheets = new Map();
            for (let stylesheet of stylesheets) {
                this._stylesheets.set(stylesheet.name, {
                    stylesheet: stylesheet,
                    ast: tools.parse(stylesheet.stylesheet)
                });
            }
            this.stylesheetsChanged.emit();
        }
        else {
            this._stylesheets = null;
        }
    }

    getStylesheets(): IStylesheet[] {
        let stylesheets: IStylesheet[] = [];
        for (let item of this._stylesheets) {
            stylesheets.push(item[1].stylesheet);
        };
        return stylesheets;
    }

    public getAppliedRules(designItem: IDesignItem): IStyleRule[] {
        return null;
    }

    public getDeclarations(designItem: IDesignItem, prop: IProperty): IStyleDeclaration[] {
        return null;
    }

    public updateDeclarationWithProperty(designItem: IDesignItem, property: IProperty, value: string, important: boolean): boolean {
        return false;
    }

    public updateDeclarationWithDeclaration(declaration: IStyleDeclaration, value: string, important: boolean): boolean {
        return true;
    }
}