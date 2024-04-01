import { IStyleRule, IStylesheet, IStyleDeclaration, AbstractStylesheetService, IDesignerCanvas, IDesignItem, IDocumentStylesheet } from "@node-projects/web-component-designer";
import { calculate as calculateSpecifity } from "./SpecificityCalculator.js";
import type * as csstree from 'css-tree';

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
    stylesheet: IStylesheet
}

interface IDeclarationWithAST extends IStyleDeclaration {
    ast: csstree.DeclarationPlain
}

export class CssTreeStylesheetService extends AbstractStylesheetService {

    constructor(designerCanvas: IDesignerCanvas) {
        super(designerCanvas)
    }

    async internalParse(style: string) {
        return <any>window.csstree.toPlainObject((window.csstree.parse(style, { positions: true, parseValue: false })));
    }

    /* Section covers the retrieval of rules and declarations */
    private getAppliedRulesInternal(designItem: IDesignItem): IRuleWithAST[] {
        let styles: IRuleWithAST[] = [];
        for (let item of this._allStylesheets) {
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
                stylesheet: rule.stylesheet
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
    updateDeclarationValueWithoutUndo(declaration: IDeclarationWithAST, value: string, important: boolean) {
        let sourceNode = this._allStylesheets.get(declaration.parent.stylesheetName);
        declaration.ast.value = (<any>window.csstree.toPlainObject(window.csstree.parse(declaration.name + ": " + value + (important ? " !important" : ""), { context: 'declaration', parseValue: false }))).value;
        const old = sourceNode.stylesheet.content;
        sourceNode.stylesheet.content = window.csstree.generate(window.csstree.fromPlainObject(sourceNode.ast));

        // After generating the stylesheet, parse again (so line numbers are correct)
        sourceNode.ast = <any>window.csstree.toPlainObject((window.csstree.parse(sourceNode.stylesheet.content, { positions: true, parseValue: false })))
        if ((<IDocumentStylesheet>sourceNode.stylesheet).designItem) {
            (<IDocumentStylesheet>sourceNode.stylesheet).designItem.content = sourceNode.stylesheet.content;
        } else
            this.stylesheetChanged.emit({ name: sourceNode.stylesheet.name, newStyle: sourceNode.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
    }

    insertDeclarationIntoRule(rule: IRuleWithAST, property: string, value: string, important: boolean): boolean {
        let sourceNode = this._allStylesheets.get(rule.stylesheetName);
        rule.ast.block.children.push(window.csstree.toPlainObject(window.csstree.parse(property + ": " + value + (important ? " !important" : ""), { context: 'declaration', parseValue: false })));
        const old = sourceNode.stylesheet.content;
        sourceNode.stylesheet.content = window.csstree.generate(window.csstree.fromPlainObject(sourceNode.ast));

        // After generating the stylesheet, parse again (so line numbers are correct)
        sourceNode.ast = <any>window.csstree.toPlainObject((window.csstree.parse(sourceNode.stylesheet.content, { positions: true, parseValue: false })))
        if ((<IDocumentStylesheet>sourceNode.stylesheet).designItem) {
            (<IDocumentStylesheet>sourceNode.stylesheet).designItem.content = sourceNode.stylesheet.content;
        } else
            this.stylesheetChanged.emit({ name: sourceNode.stylesheet.name, newStyle: sourceNode.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
        return true;
    }

    removeDeclarationFromRule(rule: IRuleWithAST, property: string): boolean {
        let index = rule.ast.block.children.findIndex(x => (<csstree.Declaration>x).property == property);
        if (index == -1) return false;
        rule.ast.block.children.splice(index, 1);
        const ss = this._allStylesheets.get(rule.stylesheetName);
        const old = ss.stylesheet.content;
        ss.stylesheet.content = window.csstree.generate(window.csstree.fromPlainObject(this._allStylesheets.get(rule.stylesheetName).ast));
        // After generating the stylesheet, parse again (so line numbers are correct)
        ss.ast = <any>window.csstree.toPlainObject((window.csstree.parse(this._allStylesheets.get(rule.stylesheetName).stylesheet.content, { positions: true, parseValue: false })))
        if ((<IDocumentStylesheet>ss.stylesheet).designItem) {
            (<IDocumentStylesheet>ss.stylesheet).designItem.content = ss.stylesheet.content;
        } else
            this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
        return true;
    }

    async updateCompleteStylesheet(name: string, newStyle: string) {
        this.updateCompleteStylesheetInternal(name, newStyle, 'styleupdate');
    }

    async updateCompleteStylesheetWithoutUndo(name: string, newStyle: string, noUndo = false) {
        this.updateCompleteStylesheetInternal(name, newStyle, 'undo');
    }

    private updateCompleteStylesheetInternal(name: string, newStyle: string, changeSource: 'undo' | 'styleupdate') {
        const ss = this._allStylesheets.get(name);
        if (ss.stylesheet.content != newStyle) {
            const old = ss.stylesheet.content;
            ss.stylesheet.content = newStyle;
            if ((<IDocumentStylesheet>ss.stylesheet).designItem) {
                (<IDocumentStylesheet>ss.stylesheet).designItem.content = ss.stylesheet.content;
            } else
                this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource });
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
                    stylesheet: this._allStylesheets.get(source).stylesheet
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

    getRules(selector: string): IStyleRule[] {
        const rules = this.getAppliedRules(null);
        return rules.filter(x => x.selector == selector);
    }

    addRule(stylesheet: IStylesheet, rule: string): Promise<IStyleRule> {
        throw new Error("not implemented");
    }
}