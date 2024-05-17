import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../item/IDesignItem.js';
import { IDocumentStylesheet, IStyleDeclaration, IStyleRule, IStylesheet, IStylesheetService } from './IStylesheetService.js';
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { forceActiveAttributeName, forceFocusAttributeName, forceFocusVisibleAttributeName, forceFocusWithinAttributeName, forceHoverAttributeName, forceVisitedAttributeName } from "../../item/DesignItem.js";

export abstract class AbstractStylesheetService implements IStylesheetService {
    protected _stylesheets = new Map<string, { stylesheet: IStylesheet, ast: any }>();
    protected _documentStylesheets = new Map<string, { stylesheet: IDocumentStylesheet, ast: any }>();
    protected _allStylesheets = new Map<string, { stylesheet: IStylesheet | IDocumentStylesheet, ast: any }>();

    protected _instanceServiceContainer: InstanceServiceContainer;

    constructor(designerCanvas: IDesignerCanvas) {
        this._instanceServiceContainer = designerCanvas.instanceServiceContainer;
    }

    abstract getRules(rule: string): IStyleRule[];
    abstract addRule(stylesheet: IStylesheet, rule: string): Promise<IStyleRule>;

    async setStylesheets(stylesheets: IStylesheet[]): Promise<void> {
        await this.internalSetStylesheets(stylesheets, this._stylesheets);
    }

    async setDocumentStylesheets(stylesheets: IDocumentStylesheet[]): Promise<void> {
        await this.internalSetStylesheets(stylesheets, this._documentStylesheets);
    }

    async internalSetStylesheets(stylesheets: IStylesheet[], targetMap: Map<string, { stylesheet: IStylesheet, ast: any }>): Promise<void> {
        if (targetMap != null && stylesheets != null && targetMap.size == stylesheets.length && stylesheets.every(x => targetMap.has(x.name))) {
            for (let stylesheet of stylesheets) {
                const old = targetMap.get(stylesheet.name);
                if (old.stylesheet.content != stylesheet.content) {
                    try {
                        targetMap.set(stylesheet.name, {
                            stylesheet: stylesheet,
                            ast: await this.internalParse(stylesheet.content)
                        });
                    }
                    catch (err) {
                        console.warn("error parsing stylesheet", stylesheet, err)
                    }
                    if (targetMap == this._stylesheets)
                        this.stylesheetChanged.emit({ name: stylesheet.name, newStyle: stylesheet.content, oldStyle: old.stylesheet.content, changeSource: 'extern' });
                }
            }
        } else if (stylesheets != null) {
            targetMap.clear();
            for (let stylesheet of stylesheets) {
                let ast = null;
                try {
                    ast = await this.internalParse(stylesheet.content)
                }
                catch (err) {
                    console.warn("error parsing stylesheet", stylesheet, err)
                }
                targetMap.set(stylesheet.name, {
                    stylesheet: stylesheet,
                    ast: ast
                });
            }
            if (targetMap == this._stylesheets)
                this.stylesheetsChanged.emit();
        } else {
            targetMap.clear();
        }

        this._allStylesheets.clear();
        for (let s of this._documentStylesheets) {
            this._allStylesheets.set(s[0], s[1]);
        }
        for (let s of this._stylesheets) {
            this._allStylesheets.set(s[0], s[1]);
        }
    }

    protected async internalReparseStylesheet(name: string) {
        let lst = this._allStylesheets;
        if (this._documentStylesheets.has(name))
            lst = this._documentStylesheets;
        if (this._stylesheets.has(name))
            lst = this._stylesheets;

        const ss = lst.get(name);
        let ast = null;
        try {
            ast = await this.internalParse(ss.stylesheet.content)
        }
        catch (err) {
            console.warn("error parsing stylesheet", name, err)
        }
        const v = {
            stylesheet: ss.stylesheet,
            ast: ast
        }
        this._stylesheets.set(name, v);
        this._allStylesheets.set(name, v);
    }

    protected abstract internalParse(style: string): Promise<any>;

    //TODO: rename to externalStylesheets
    getStylesheets(): IStylesheet[] {
        let stylesheets: IStylesheet[] = [];
        for (let item of this._stylesheets) {
            stylesheets.push(item[1].stylesheet);
        };
        /*for (let item of this._documentStylesheets) {
            stylesheets.push(item[1].stylesheet);
        };*/
        return stylesheets;
    }

    abstract getAppliedRules(designItem: IDesignItem): IStyleRule[]
    abstract getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[]

    public updateDeclarationValue(declaration: IStyleDeclaration, value: string, important: boolean) {
        this.updateDeclarationValueWithoutUndo(declaration, value, important);
    }

    abstract insertDeclarationIntoRule(rule: IStyleRule, property: string, value: string, important: boolean): boolean
    abstract removeDeclarationFromRule(rule: IStyleRule, property: string): boolean;
    abstract updateCompleteStylesheet(name: string, newStyle: string);
    abstract updateCompleteStylesheetWithoutUndo(name: string, newStyle: string);

    public abstract updateDeclarationValueWithoutUndo(declaration: IStyleDeclaration, value: string, important: boolean)

    public stylesheetChanged = new TypedEvent<{ name: string, newStyle: string, oldStyle: string, changeSource: 'extern' | 'styleupdate' | 'undo' }>();
    public stylesheetsChanged: TypedEvent<void> = new TypedEvent<void>();

    public static patchStylesheetSelectorForDesigner(text: string) {
        return text.replaceAll(':hover', '[' + forceHoverAttributeName + ']')
            .replaceAll(':active', '[' + forceActiveAttributeName + ']')
            .replaceAll(':visited', '[' + forceVisitedAttributeName + ']')
            .replaceAll(':focus', '[' + forceFocusAttributeName + ']')
            .replaceAll(':focus-within', '[' + forceFocusWithinAttributeName + ']')
            .replaceAll(':focus-visible', '[' + forceFocusVisibleAttributeName + ']');
    }

    protected elementMatchesASelector(designItem: IDesignItem, selectors: string[]) {
        if (designItem == null)
            return true;

        for (let selector of selectors) {
            const patched = AbstractStylesheetService.patchStylesheetSelectorForDesigner(selector);
            try {
                if (designItem.element.matches(patched))
                    return true;
            }
            catch (err) {
                console.warn("invalid selector: ", selector, "patched: " + patched);
            }
        }
        return false;
    }
}