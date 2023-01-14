import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";
import { IStyleDeclaration, IStyleRule, IStylesheet, IStylesheetService } from "./IStylesheetService.js";

import type * as csstree from 'css-tree';
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { calculate as calculateSpecifity } from "./SpecificityCalculator.js";

declare global {
    interface Window {
        csstree: {
            fromPlainObject(node: csstree.CssNodePlain): csstree.CssNode;
            toPlainObject(node: csstree.CssNode): csstree.CssNodePlain;
            parse(text: string, options?: csstree.ParseOptions): csstree.CssNode;
            generate(ast: csstree.CssNode, options?: csstree.GenerateOptions): string;
        }
    }
}

interface IRuleWithAST extends IStyleRule {
    ast: csstree.RulePlain,
    declarations: IDeclarationWithAST[],
}

interface IDeclarationWithAST extends IStyleDeclaration {
    ast: csstree.DeclarationPlain,
    parent: IStyleRule,
}

export class CssTreeStylesheetService implements IStylesheetService {
    private _stylesheets = new Map<string, { stylesheet: IStylesheet, ast: csstree.StyleSheetPlain }>();
    stylesheetChanged: TypedEvent<{ stylesheet: IStylesheet; }> = new TypedEvent<{ stylesheet: IStylesheet; }>();

    public constructor() { }

    setStylesheets(stylesheets: IStylesheet[]) {
        if (stylesheets != null) {
            this._stylesheets = new Map();
            for (let stylesheet of stylesheets) {
                this._stylesheets.set(stylesheet.name, {
                    stylesheet: stylesheet,
                    ast: <any>window.csstree.toPlainObject((window.csstree.parse(stylesheet.stylesheet, { positions: true, parseValue: false })))
                });
            }
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

    /* Section covers the retrieval of rules and declarations */
    private getAppliedRulesInternal(designItem: IDesignItem): IRuleWithAST[] {
        let styles: IRuleWithAST[] = [];
        for (let item of this._stylesheets) {
            if (!item[1].ast || !this.astHasChildren(item[1].ast)) break;
            styles = styles.concat(Array.from(this.rulesFromAST(item[1].ast, item[1].stylesheet.stylesheet, item[0], designItem)));
        };
        return styles;
    }

    public getAppliedRules(designItem: IDesignItem): IRuleWithAST[] {
        let rules = this.getAppliedRulesInternal(designItem);
        if (!rules || rules.length == 0) return [];

        let retCollection: IRuleWithAST[] = [];
        for (let rule of rules) {
            retCollection.push({
                ...rule,
                declarations: rule.ast.block.children.map((declaration: csstree.DeclarationPlain) => {
                    return {
                        name: declaration.property,
                        value: (declaration.value as csstree.Raw).value,
                        important: declaration.important == true,
                        specificity: rule.specificity,
                        parent: rule,
                        ast: declaration,
                    }
                })
            });
        }
        return retCollection;
    }

    private getDeclarationInternal(designItem: IDesignItem, prop: IProperty): IDeclarationWithAST[] {
        let rules = this.getAppliedRulesInternal(designItem);
        if (!rules) return null;

        let declarations: IDeclarationWithAST[] = [];
        for (let rule of rules) {
            let declaration = this.findDeclarationInRule(rule.ast, prop);
            if (!declaration) continue;
            declarations.push({
                ast: declaration,
                parent: rule,
                name: prop.name,
                value: (declaration.value as csstree.Raw).value,
                important: declaration.important == true,
            })
        };

        return declarations;
    }

    public getDeclarations(designItem: IDesignItem, prop: IProperty): IDeclarationWithAST[] {
        let declarations = this.getDeclarationInternal(designItem, prop);
        if (!declarations) return null;

        return this.sortDeclarations(declarations);
    }

    /* Section covers the update of rules and declarations */

    public updateDeclarationWithProperty(designItem: IDesignItem, property: IProperty, value: string, important: boolean): boolean {
        let sortedDecl = this.sortDeclarations(this.getDeclarationInternal(designItem, property));
        if (!sortedDecl) {
            // no declaration of property yet
            return false;
        }
        return false;
    }

    updateDeclarationWithDeclaration(declaration: IDeclarationWithAST, value: string, important: boolean): boolean {
        declaration.ast.value = (<any>window.csstree.toPlainObject(window.csstree.parse(declaration.name + ": " + value, { context: 'declaration', parseValue: false }))).value;
        this._stylesheets.get(declaration.parent.stylesheetName).stylesheet.stylesheet = window.csstree.generate(window.csstree.fromPlainObject(this._stylesheets.get(declaration.parent.stylesheetName).ast));
        this.stylesheetChanged.emit({ stylesheet: this._stylesheets.get(declaration.parent.stylesheetName).stylesheet });
        return true;
    }

    /* Section covers the internal traversal creation of rules and declarations */

    private *rulesFromAST(ast: csstree.StyleSheetPlain | csstree.AtrulePlain, stylesheet: string, source: string, designItem: IDesignItem, previousCheck: string = ''): IterableIterator<IRuleWithAST> {
        let parent = ast["children"] != null ? ast : (ast as csstree.AtrulePlain).block;

        for (const child of (parent as csstree.BlockPlain).children) {
            if (child.type == "Atrule") {
                const currentCheck = this.buildAtRuleString(child, stylesheet);
                if (currentCheck.type === "@media" && !window.matchMedia(currentCheck.sel)) continue;
                if (currentCheck.type === "@supports" && !CSS.supports(currentCheck.sel)) continue;

                let ruleCollection = this.rulesFromAST(child, stylesheet, source, designItem, previousCheck + currentCheck.type + " " + currentCheck.sel + "\n");
                if (ruleCollection) {
                    for (const r of ruleCollection) {
                        if (!this.elementMatchesASelector(designItem, this.buildSelectorString(r.ast.prelude as csstree.SelectorListPlain)))
                            continue;
                        yield r;
                    }
                }
            }
            if (child.type == "Rule") {
                let selectors = this.buildSelectorString((child as csstree.RulePlain).prelude as csstree.SelectorListPlain);
                if (!this.elementMatchesASelector(designItem, selectors)) continue;

                yield ({
                    ast: (child as csstree.RulePlain),
                    selector: previousCheck + this.buildSelectorString((child as csstree.RulePlain).prelude as csstree.SelectorListPlain).join(", "),
                    specificity: this.getSpecificity((child as csstree.RulePlain).prelude as csstree.SelectorListPlain),
                    stylesheetName: source,
                    declarations: null,
                });
            }
        };
    }


    /* Utility functions for building selectors, specificity and so on  */

    private astHasChildren(ast: csstree.CssNodePlain): boolean {
        return ast != null && ast["children"] != null && ast["children"].length > 0;
    }

    private buildSelectorString(selectorsAST: csstree.SelectorListPlain): string[] {
        let selectors: string[] = [];
        for (let selector of selectorsAST.children as csstree.SelectorPlain[]) {
            let sel = "";
            for (let fraction of selector.children as csstree.TypeSelector[]) {
                sel += fraction.name;
            }
            selectors.push(sel);
        };

        return selectors;
    }

    private getSpecificity(selector: csstree.SelectorListPlain): number {
        const specificities = calculateSpecifity(selector);
        let sum = 0;
        specificities.forEach(specificity => sum += specificity.a * 10000 + specificity.b * 100 + specificity.c);

        return sum;
    }

    private findDeclarationInRule(rule: csstree.RulePlain, property: IProperty): csstree.DeclarationPlain {
        return (rule.block.children as csstree.DeclarationPlain[]).find(declaration => declaration.property == property.name)
    }

    private elementMatchesASelector(designItem: IDesignItem, selectors: string[]) {
        for (const selector of selectors)
            if (designItem.element.matches(selector)) return true;
        return false;
    }

    private buildAtRuleString(ast: csstree.AtrulePlain, stylesheet: string): { sel: string, type: string } {
        return {
            sel: stylesheet.slice(ast.prelude.loc.start.offset, ast.prelude.loc.end.offset),
            type: "@" + ast.name
        }
    }

    private sortDeclarations(declarations: IDeclarationWithAST[]): IDeclarationWithAST[] {
        if (declarations == null || declarations.length == 0) return null;
        return declarations.sort((dec1, dec2) => {
            if (dec1.parent.specificity > dec2.parent.specificity) return -1;
            return 1;
        })
    }
}