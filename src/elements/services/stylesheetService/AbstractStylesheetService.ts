import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem";
import { DesignerCanvas } from "../../widgets/designerView/designerCanvas";
import { IDocumentStylesheet, IStyleDeclaration, IStyleRule, IStylesheet, IStylesheetService } from "./IStylesheetService";

export abstract class AbstractStylesheetService implements IStylesheetService {
    protected _stylesheets = new Map<string, { stylesheet: IStylesheet, ast: any }>();
    protected _documentStylesheets = new Map<string, { stylesheet: IDocumentStylesheet, ast: any }>();
    protected _allStylesheets = new Map<string, { stylesheet: IStylesheet | IDocumentStylesheet, ast: any }>();

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
                    this.stylesheetChanged.emit({ name: stylesheet.name, newStyle: stylesheet.content, oldStyle: old.stylesheet.content, changeSource: 'extern' });
                }
            }
        } else if (stylesheets != null) {
            targetMap.clear();
            for (let stylesheet of stylesheets) {
                try {
                    targetMap.set(stylesheet.name, {
                        stylesheet: stylesheet,
                        ast: await this.internalParse(stylesheet.content)
                    });
                }
                catch (err) {
                    console.warn("error parsing stylesheet", stylesheet, err)
                }
            }
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

    protected abstract internalParse(style: string): Promise<any>;

    getStylesheets(): IStylesheet[] {
        let stylesheets: IStylesheet[] = [];
        for (let item of this._stylesheets) {
            stylesheets.push(item[1].stylesheet);
        };
        for (let item of this._documentStylesheets) {
            stylesheets.push(item[1].stylesheet);
        };
        return stylesheets;
    }

    abstract getAppliedRules(designItem: IDesignItem): IStyleRule[]
    abstract getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[]
    abstract updateDeclarationValue(declaration: IStyleDeclaration, value: string, important: boolean): boolean
    abstract insertDeclarationIntoRule(rule: IStyleRule, property: string, value: string, important: boolean): boolean
    abstract removeDeclarationFromRule(rule: IStyleRule, property: string): boolean;
    abstract updateCompleteStylesheet(name: string, newStyle: string);

    public stylesheetChanged = new TypedEvent<{ name: string, newStyle: string, oldStyle: string, changeSource: 'extern' | 'styleupdate' }>();
    public stylesheetsChanged: TypedEvent<void> = new TypedEvent<void>();

    protected elementMatchesASelector(designItem: IDesignItem, selectors: string[]) {
        for (const selector of selectors)
            if (designItem.element.matches(selector)) return true;
        return false;
    }


    public static buildPatchedStyleSheet(value: CSSStyleSheet[]): string {
        let style = '';
        for (let s of value) {
            style += this.traverseAndCollectRules(s);
        }
        return style;
    }

    private static traverseAndCollectRules(ruleContainer: CSSStyleSheet | CSSMediaRule | CSSContainerRule): string {
        let t = '';
        for (let rule of ruleContainer.cssRules) {
            if ((rule instanceof CSSContainerRule
                || rule instanceof CSSSupportsRule
                || rule instanceof CSSMediaRule)
                && rule.cssRules) {
                t += rule.cssText.split(rule.conditionText)[0] + rule.conditionText + " { " + this.traverseAndCollectRules(rule) + " }";
            }
            if (rule instanceof CSSStyleRule) {
                let parts = rule.selectorText.split(',');
                let sel = "";
                for (let p of parts) {
                    if (p.includes(DesignerCanvas.cssprefixConstant)) {
                        sel += p;
                        continue;
                    }
                    if (sel)
                        sel += ',';
                    sel += DesignerCanvas.cssprefixConstant + p.trimStart();
                }
                t += sel;
                let cssText = rule.style.cssText;
                //bugfix for chrome issue: https://bugs.chromium.org/p/chromium/issues/detail?id=1394353 
                if ((<any>rule).styleMap && (<any>rule).styleMap.get('grid-template') && (<any>rule).styleMap.get('grid-template').toString().includes('repeat(')) {
                    let entr = (<any>rule).styleMap.entries();
                    cssText = ''
                    for (let e of entr) {
                        cssText += e[0] + ':' + e[1].toString() + ';';
                    }
                }
                t += '{' + cssText + '}';
            }
        }
        return t;
    }
}