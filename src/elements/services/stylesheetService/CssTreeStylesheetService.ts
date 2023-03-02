import { IDesignItem } from "../../item/IDesignItem.js";
import { IStyleDeclaration, IStyleRule, IStylesheet } from "./IStylesheetService.js";
import { calculate as calculateSpecifity } from "./SpecificityCalculator.js";
import { AbstractStylesheetService } from "./AbstractStylesheetService.js";

//import type * as csstree from 'css-tree';
namespace csstree {
    export type CssNodePlain = any;
    export type CssNode = any;
    export type ParseOptions = any;
    export type GenerateOptions = any;
    export type RulePlain = any;
    export type DeclarationPlain = any;
    export type StyleSheetPlain = any;
    export type Raw = any;
    export type Declaration = any;
    export type AtrulePlain = any;
    export type BlockPlain = any;
    export type SelectorListPlain = any;
}

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
    ast: csstree.DeclarationPlain
}

export class CssTreeStylesheetService extends AbstractStylesheetService {
    private _stylesheets = new Map<string, { stylesheet: IStylesheet, ast: csstree.StyleSheetPlain }>();

    setStylesheets(stylesheets: IStylesheet[]) {
        if (stylesheets != null) {
            this._stylesheets = new Map();
            for (let stylesheet of stylesheets) {
                try {
                    this._stylesheets.set(stylesheet.name, {
                        stylesheet: stylesheet,
                        ast: <any>window.csstree.toPlainObject((window.csstree.parse(stylesheet.content, { positions: true, parseValue: false })))
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

    /* Section covers the retrieval of rules and declarations */
    private getAppliedRulesInternal(designItem: IDesignItem): IRuleWithAST[] {
        let styles: IRuleWithAST[] = [];
        for (let item of this._stylesheets) {
            if (!item[1].ast || !this.astHasChildren(item[1].ast)) continue;
            styles = styles.concat(Array.from(this.rulesFromAST(item[1].ast, item[1].stylesheet.content, item[0], designItem)));
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

    private getDeclarationInternal(designItem: IDesignItem, styleName: string): IDeclarationWithAST[] {
        let rules = this.getAppliedRulesInternal(designItem);
        if (!rules) return null;

        let declarations: IDeclarationWithAST[] = [];
        for (let rule of rules) {
            let declaration = this.findDeclarationInRule(rule.ast, styleName);
            if (!declaration) continue;
            declarations.push({
                ast: declaration,
                parent: rule,
                name: styleName,
                value: (declaration.value as csstree.Raw).value,
                important: declaration.important == true,
            })
        };

        return declarations;
    }

    public getDeclarations(designItem: IDesignItem, stlyeName: string): IDeclarationWithAST[] {
        let declarations = this.getDeclarationInternal(designItem, stlyeName);
        if (!declarations) return null;

        return this.sortDeclarations(declarations);
    }

    /* Section covers the update of rules and declarations */
    updateDeclarationValue(declaration: IDeclarationWithAST, value: string, important: boolean): boolean {
        let sourceNode = this._stylesheets.get(declaration.parent.stylesheetName);
        declaration.ast.value = (<any>window.csstree.toPlainObject(window.csstree.parse(declaration.name + ": " + value + (important ? " !important" : ""), { context: 'declaration', parseValue: false }))).value;
        const old = sourceNode.stylesheet.content;
        sourceNode.stylesheet.content = window.csstree.generate(window.csstree.fromPlainObject(sourceNode.ast));

        // After generating the stylesheet, parse again (so line numbers are correct)
        sourceNode.ast = <any>window.csstree.toPlainObject((window.csstree.parse(sourceNode.stylesheet.content, { positions: true, parseValue: false })))
        this.stylesheetChanged.emit({ name: sourceNode.stylesheet.name, newStyle: sourceNode.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
        return true;
    }

    insertDeclarationIntoRule(rule: IRuleWithAST, property: string, value: string, important: boolean): boolean {
        let sourceNode = this._stylesheets.get(rule.stylesheetName);
        rule.ast.block.children.push(window.csstree.toPlainObject(window.csstree.parse(property + ": " + value + (important ? " !important" : ""), { context: 'declaration', parseValue: false })));
        const old = sourceNode.stylesheet.content;
        sourceNode.stylesheet.content = window.csstree.generate(window.csstree.fromPlainObject(sourceNode.ast));

        // After generating the stylesheet, parse again (so line numbers are correct)
        sourceNode.ast = <any>window.csstree.toPlainObject((window.csstree.parse(sourceNode.stylesheet.content, { positions: true, parseValue: false })))

        this.stylesheetChanged.emit({ name: sourceNode.stylesheet.name, newStyle: sourceNode.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
        return true;
    }

    removeDeclarationFromRule(rule: IRuleWithAST, property: string): boolean {
        let index = rule.ast.block.children.findIndex(x => (<csstree.Declaration>x).property == property);
        if (index == -1) return false;
        rule.ast.block.children.splice(index, 1);
        const ss = this._stylesheets.get(rule.stylesheetName);
        const old = ss.stylesheet.content;
        ss.stylesheet.content = window.csstree.generate(window.csstree.fromPlainObject(this._stylesheets.get(rule.stylesheetName).ast));
        // After generating the stylesheet, parse again (so line numbers are correct)
        ss.ast = <any>window.csstree.toPlainObject((window.csstree.parse(this._stylesheets.get(rule.stylesheetName).stylesheet.content, { positions: true, parseValue: false })))

        this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
        return true;
    }

    updateCompleteStylesheet(name: string, newStyle: string) {
        const ss = this._stylesheets.get(name);
        if (ss.stylesheet.content != newStyle) {
            const old = ss.stylesheet.content;
            ss.stylesheet.content = newStyle;
            this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
        }
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
                        if (!this.elementMatchesASelector(designItem, this.buildSelectorString(r.ast.prelude as csstree.SelectorListPlain, stylesheet)))
                            continue;
                        yield r;
                    }
                }
            }
            if (child.type == "Rule") {
                let selectors = this.buildSelectorString((child as csstree.RulePlain).prelude as csstree.SelectorListPlain, stylesheet);
                if (!this.elementMatchesASelector(designItem, selectors)) continue;

                yield ({
                    ast: (child as csstree.RulePlain),
                    selector: previousCheck + this.buildSelectorString((child as csstree.RulePlain).prelude as csstree.SelectorListPlain, stylesheet).join(", "),
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

    private buildSelectorString(selectorsAST: csstree.SelectorListPlain, stylesheet: string): string[] {
        if (selectorsAST.type == 'SelectorList') {
            return [...selectorsAST.children.map(x => this.buildSelectorString(<csstree.SelectorListPlain>x, stylesheet)[0])];
        }
        else {
            return [stylesheet.substring(selectorsAST.loc.start.offset, selectorsAST.loc.end.offset)];
        }
    }

    private getSpecificity(selector: csstree.SelectorListPlain): number {
        const specificities = calculateSpecifity(selector);
        let sum = 0;
        specificities.forEach(specificity => sum += specificity.a * 10000 + specificity.b * 100 + specificity.c);

        return sum;
    }

    private findDeclarationInRule(rule: csstree.RulePlain, styleName: string): csstree.DeclarationPlain {
        return (rule.block.children as csstree.DeclarationPlain[]).find(declaration => declaration.property == styleName);
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