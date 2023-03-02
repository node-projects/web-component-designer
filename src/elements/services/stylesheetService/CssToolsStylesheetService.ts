import { IDesignItem } from "../../item/IDesignItem.js";
import { IStyleDeclaration, IStyleRule, IStylesheet } from "./IStylesheetService.js";
import { AbstractStylesheetService } from "./AbstractStylesheetService.js";

import type { CssAtRuleAST, CssDeclarationAST, CssRuleAST, CssStylesheetAST } from "@adobe/css-tools";
/*type CssRuleAST = any;
type CssDeclarationAST = any;
type CssStylesheetAST = any;
type CssAtRuleAST = any;*/

interface IRuleWithAST extends IStyleRule {
    ast: CssRuleAST,
    declarations: IDeclarationWithAST[],
    stylesheet: IStylesheet;
    stylesheetName: string;
}

interface IDeclarationWithAST extends IStyleDeclaration {
    ast: CssDeclarationAST
}

export class CssToolsStylesheetService extends AbstractStylesheetService {
    private _stylesheets = new Map<string, { stylesheet: IStylesheet, ast: CssStylesheetAST }>();

    _tools: {
        parse: (css: string, options?: { source?: string; silent?: boolean; }) => CssStylesheetAST;
        stringify: (node: CssStylesheetAST, options?: { indent?: string; compress?: boolean; emptyDeclarations?: boolean; }) => string;
    };

    async setStylesheets(stylesheets: IStylesheet[]) {
        if (!this._tools)
            this._tools = await import('@adobe/css-tools');

        if (this._stylesheets != null && stylesheets != null && this._stylesheets.size == stylesheets.length && stylesheets.every(x => this._stylesheets.has(x.name))) {
            for (let stylesheet of stylesheets) {
                const old = this._stylesheets.get(stylesheet.name);
                if (old.stylesheet.content != stylesheet.content) {
                    try {
                        this._stylesheets.set(stylesheet.name, {
                            stylesheet: stylesheet,
                            ast: this._tools.parse(stylesheet.content)
                        });
                    }
                    catch (err) {
                        console.warn("error parsing stylesheet", stylesheet, err)
                    }
                    this.stylesheetChanged.emit({ name: stylesheet.name, newStyle: stylesheet.content, oldStyle: old.stylesheet.content, changeSource: 'extern' });
                }
            }
        } else if (stylesheets != null) {
            this._stylesheets = new Map();
            for (let stylesheet of stylesheets) {
                try {
                    this._stylesheets.set(stylesheet.name, {
                        stylesheet: stylesheet,
                        ast: this._tools.parse(stylesheet.content)
                    });
                }
                catch (err) {
                    console.warn("error parsing stylesheet", stylesheet, err)
                }
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

    public getAppliedRules(designItem: IDesignItem): IRuleWithAST[] {
        let rules: IRuleWithAST[] = [];
        for (let item of this._stylesheets.entries()) {
            if (!item[1].ast?.stylesheet?.rules) continue;
            let rs = Array.from(this.getRulesFromAst(item[1].ast?.stylesheet?.rules, item[1].stylesheet, designItem))
                .map(x => (<IRuleWithAST>{
                    selector: x.selectors.join(', '),
                    declarations: x.declarations.filter(y => y.type == 'declaration').map(y => ({
                        name: (<CssDeclarationAST>y).property,
                        value: (<CssDeclarationAST>y).value.endsWith('!important') ? (<CssDeclarationAST>y).value.substring(0, (<CssDeclarationAST>y).value.length - 10).trimEnd() : (<CssDeclarationAST>y).value,
                        important: (<CssDeclarationAST>y).value.endsWith('!important'),
                        parent: null,
                        ast: <CssDeclarationAST>y,
                    })),
                    specificity: 0,
                    stylesheetName: item[0],
                    ast: x,
                }));
            rs.forEach(x => x.declarations.forEach(y => y.parent = x));
            rules.push(...rs);
        };
        return rules;
    }

    private *getRulesFromAst(cssAtRuleAst: CssAtRuleAST[], stylesheet: IStylesheet, designItem: IDesignItem): IterableIterator<CssRuleAST> {
        for (const atRule of cssAtRuleAst) {
            if (atRule.type == 'media') {
                yield* this.getRulesFromAst(atRule.rules, stylesheet, designItem);
            } else if (atRule.type == 'supports') {
                yield* this.getRulesFromAst(atRule.rules, stylesheet, designItem);
            } else if (atRule.type == 'rule') {
                if (this.elementMatchesASelector(designItem, atRule.selectors))
                    yield atRule;
            }
        }
        return null;
    }

    public getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[] {
        return this.getAppliedRules(designItem).flatMap(x => x.declarations).filter(x => x.name == styleName);
    }

    public updateDeclarationValue(declaration: IDeclarationWithAST, value: string, important: boolean): boolean {
        declaration.ast.value = important ? value + ' !important' : value;
        let ss = this._stylesheets.get(declaration.parent.stylesheetName);
        this.updateStylesheet(ss);
        return true;
    }

    public insertDeclarationIntoRule(rule: IRuleWithAST, property: string, value: string, important: boolean): boolean {
        rule.ast.declarations.push(<CssDeclarationAST>{
            type: 'declaration',
            property: property,
            value: important ? value + ' !important' : value
        });
        this.updateStylesheet(this._stylesheets.get(rule.stylesheetName));
        return true;
    }

    removeDeclarationFromRule(rule: IRuleWithAST, property: string): boolean {
        let idx = rule.ast.declarations.findIndex(x => (<CssDeclarationAST>x).property == property);
        if (idx == -1) return false;
        rule.ast.declarations.splice(idx, 1);
        this.updateStylesheet(this._stylesheets.get(rule.stylesheetName));
        return true;
    }

    private updateStylesheet(ss: { stylesheet: IStylesheet, ast: CssStylesheetAST }) {
        const old = ss.stylesheet.content;
        ss.stylesheet.content = this._tools.stringify(ss.ast, { indent: '    ', compress: false, emptyDeclarations: true });
        this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
    }

    updateCompleteStylesheet(name: string, newStyle: string) {
        const ss = this._stylesheets.get(name);
        if (ss.stylesheet.content != newStyle) {
            const old = ss.stylesheet.content;
            ss.stylesheet.content = newStyle;
            this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
        }
    }
}