import { CssAtRuleAST, CssDeclarationAST, CssRuleAST, CssStylesheetAST, parse, stringify } from "@adobe/css-tools";
import { AbstractStylesheetService, IDocumentStylesheet, IStyleRule, IStylesheet, IStyleDeclaration, IDesignerCanvas, IDesignItem } from "@node-projects/web-component-designer";
import { Specificity } from "@node-projects/web-component-designer";

interface IRuleWithAST extends IStyleRule {
    ast: CssRuleAST,
    declarations: IDeclarationWithAST[],
    stylesheet: IStylesheet;
    stylesheetName: string;
    specificity: Specificity;
}

interface IDeclarationWithAST extends IStyleDeclaration {
    ast: CssDeclarationAST
}

export class CssToolsStylesheetService extends AbstractStylesheetService {

    constructor(designerCanvas: IDesignerCanvas) {
        super(designerCanvas)
    }

    async internalParse(style: string) {
        return parse(style);
    }

    public getAppliedRules(designItem: IDesignItem): IRuleWithAST[] {
        let rules: IRuleWithAST[] = [];
        for (let item of this._allStylesheets.entries()) {
            if (!item[1].ast?.stylesheet?.rules) continue;
            let rs = Array.from(this.getRulesFromAst(item[1].ast?.stylesheet?.rules, item[1].stylesheet, designItem))
                .map(x => (<IRuleWithAST>{
                    selector: x[0].selectors.join(', '),
                    declarations: x[0].declarations.filter(y => y.type == 'declaration').map(y => ({
                        name: (<CssDeclarationAST>y).property,
                        value: (<CssDeclarationAST>y).value.endsWith('!important') ? (<CssDeclarationAST>y).value.substring(0, (<CssDeclarationAST>y).value.length - 10).trimEnd() : (<CssDeclarationAST>y).value,
                        important: (<CssDeclarationAST>y).value.endsWith('!important'),
                        parent: null,
                        ast: <CssDeclarationAST>y,
                        stylesheet: item[1].stylesheet
                    })),
                    specificity: x[1],
                    stylesheetName: item[0],
                    stylesheet: item[1].stylesheet,
                    ast: x[0],
                }));
            rs.forEach(x => x.declarations.forEach(y => y.parent = x));
            rules.push(...rs);
        }
        return rules;
    }

    getRules(selector: string): IStyleRule[] {
        const rules = this.getAppliedRules(null);
        return rules.filter(x => x.selector == selector);
    }

    async addRule(stylesheet: IStylesheet, selector: string): Promise<IStyleRule> {
        await this.updateCompleteStylesheet(stylesheet.name, stylesheet.content + '\n' + selector + ' {}');
        const rules = this.getRules(selector).filter(x => x.stylesheetName == stylesheet.name);
        return rules[rules.length - 1];
    }

    private *getRulesFromAst(cssAtRuleAst: CssAtRuleAST[], stylesheet: IStylesheet, designItem: IDesignItem): IterableIterator<[CssRuleAST, Specificity]> {
        for (const atRule of cssAtRuleAst) {
            if (atRule.type == 'media') {
                yield* this.getRulesFromAst(atRule.rules, stylesheet, designItem);
            } else if (atRule.type == 'supports') {
                yield* this.getRulesFromAst(atRule.rules, stylesheet, designItem);
            } else if (atRule.type == 'rule') {
                let spec = this.elementMatchesASelector(designItem, atRule.selectors)
                if (spec)
                    yield [atRule, spec];
            }
        }
        return null;
    }

    public getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[] {
        return this.getAppliedRules(designItem).flatMap(x => x.declarations).filter(x => x.name == styleName);
    }

    public updateDeclarationValueWithoutUndo(declaration: IDeclarationWithAST, value: string, important: boolean) {
        declaration.ast.value = important ? value + ' !important' : value;
        let ss = this._allStylesheets.get(declaration.parent.stylesheetName);
        this.updateStylesheet(ss);
        /*
        declaration.ast.value = important ? value + ' !important' : value;
        let ss = declaration.ast;
        while (ss?.parent)
            ss = ss?.parent;
        let obj = { ast: ss, stylesheet: declaration.stylesheet };
        this._allStylesheets.set(declaration.parent.stylesheetName, obj)
        this.updateStylesheet(obj);
        */
    }

    public insertDeclarationIntoRule(rule: IRuleWithAST, property: string, value: string, important: boolean): boolean {
        rule.ast.declarations.push(<CssDeclarationAST>{
            type: 'declaration',
            property: property,
            value: important ? value + ' !important' : value
        });
        this.updateStylesheet(this._allStylesheets.get(rule.stylesheetName));
        return true;
    }

    removeDeclarationFromRule(rule: IRuleWithAST, property: string): boolean {
        let idx = rule.ast.declarations.findIndex(x => (<CssDeclarationAST>x).property == property);
        if (idx == -1) return false;
        rule.ast.declarations.splice(idx, 1);
        this.updateStylesheet(this._allStylesheets.get(rule.stylesheetName));
        return true;
    }

    private updateStylesheet(ss: { stylesheet: IStylesheet, ast: CssStylesheetAST }) {
        const old = ss.stylesheet.content;
        ss.stylesheet.content = stringify(ss.ast, { indent: '    ', compress: false });
        if ((<IDocumentStylesheet>ss.stylesheet).designItem) {
            (<IDocumentStylesheet>ss.stylesheet).designItem.content = ss.stylesheet.content;
        } else
            this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource: 'styleupdate' });
    }

    async updateCompleteStylesheet(name: string, newStyle: string) {
        this.updateCompleteStylesheetInternal(name, newStyle, 'styleupdate');
    }

    async updateCompleteStylesheetWithoutUndo(name: string, newStyle: string, noUndo = false) {
        this.updateCompleteStylesheetInternal(name, newStyle, 'undo');
    }

    private async updateCompleteStylesheetInternal(name: string, newStyle: string, changeSource: 'undo' | 'styleupdate') {
        const ss = this._allStylesheets.get(name);
        if (ss.stylesheet.content != newStyle) {
            const old = ss.stylesheet.content;
            ss.stylesheet.content = newStyle;
            if (changeSource == 'styleupdate') {
                ss.ast = await this.internalParse(ss.stylesheet.content);
            }
            if ((<IDocumentStylesheet>ss.stylesheet).designItem) {
                (<IDocumentStylesheet>ss.stylesheet).designItem.content = ss.stylesheet.content;
            } else
                this.stylesheetChanged.emit({ name: ss.stylesheet.name, newStyle: ss.stylesheet.content, oldStyle: old, changeSource });
        }
    }
}