import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";
import { IStyleDeclaration, IStyleRule, IStylesheet, IStylesheetService } from "./IStylesheetService.js";

import * as csstree from 'css-tree';
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { calculate as calculateSpecifity } from "./SpecificityCalculator.js";

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

    public constructor(stylesheets: IStylesheet[]) {
        this._stylesheets = new Map();
        for (let stylesheet of stylesheets) {
            this._stylesheets.set(stylesheet.name, {
                stylesheet: stylesheet,
                ast: <any>csstree.toPlainObject((csstree.parse(stylesheet.stylesheet, { positions: true, parseValue: false })))
            });
        }
    }

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

        return rules.map(r => {
            return {
                selector: r.selector,
                declarations: r.ast.block.children.map((c: csstree.DeclarationPlain) => {
                    return {
                        name: c.property,
                        value: (c.value as csstree.Raw).value,
                        important: c.important == true,
                        specificity: r.specificity,
                        parent: r,
                        ast: c,
                    }
                }),
                ast: r.ast,
                specificity: this.getSpecificity(r.ast.prelude as csstree.SelectorListPlain),
                stylesheetName: r.stylesheetName,
            }
        });
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

    public updateDeclarationWithProperty(designItem: IDesignItem, property: IProperty, value: string, important: boolean): boolean {
        let sortedDecl = this.sortDeclarations(this.getDeclarationInternal(designItem, property));
        if (!sortedDecl) {
            // no declaration of property yet
            return false;
        }
        /*
            TODO: 
            * find all declarations of property, matching this element
            * find rule 
        */
        return false;
    }

    updateDeclarationWithDeclaration(declaration: IDeclarationWithAST, value: string, important: boolean): boolean {
        declaration.ast.value = (<any>csstree.toPlainObject(csstree.parse(declaration.name + ": " + value, { context: 'declaration', parseValue: false }))).value;
        this._stylesheets.get(declaration.parent.stylesheetName).stylesheet.stylesheet = csstree.generate(csstree.fromPlainObject(this._stylesheets.get(declaration.parent.stylesheetName).ast));
        this.stylesheetChanged.emit({ stylesheet: this._stylesheets.get(declaration.parent.stylesheetName).stylesheet });
        return true;
    }

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
        /* 
            Keep this, in case some changes in the future needs the value to be parsed again
            Currently its read from the stylesheet via start and end position
        */

        // let str = "";
        // str += "@" + ast.name;
        // for (let child of ((ast.prelude as csstree.AtrulePreludePlain).children[0] as any as csstree.MediaQueryListPlain).children) {
        //     if (child.type == "MediaFeature") {
        //         str += "(" + child.name + ": " + child.value + ")";
        //         continue;
        //     }
        //     if (child.type == "Function") {
        //         if (child.children[0].type == "Raw")
        //             str += child.name + child.children[0].value;
        //     }
        //     if (child.type == "MediaQuery") {
        //         for (let mq of child.children) {
        //             if (mq.type == "MediaFeature") {
        //                 if (mq.value.type == "Dimension") str += "(" + mq.name + ": " + mq.value.value + mq.value.unit + ")";
        //                 else if(mq.value.type == "Ratio") str += "(" + mq.name + ": " + mq.value.left + "/" + mq.value.right + ")";
        //                 else if(mq.value.type == "Identifier") str += "(" + mq.name + ": " + mq.value.name + ")";
        //                 continue;
        //             }
        //         }
        //     }
        //     str += child
        // }
        return {
            sel: stylesheet.slice(ast.prelude.loc.start.offset, ast.prelude.loc.end.offset),
            type: "@" + ast.name
        }
    }

    getAllStylesheets(): IStylesheet[] {
        let stylesheets: IStylesheet[] = [];
        for (let item of this._stylesheets) {
            stylesheets.push(item[1].stylesheet);
        };
        return stylesheets;
    }

    private sortDeclarations(declarations: IDeclarationWithAST[]): IDeclarationWithAST[] {
        if (declarations == null || declarations.length == 0) return null;
        return declarations.sort((dec1, dec2) => {
            if (dec1.parent.specificity > dec2.parent.specificity) return -1;
            return 1;
        })
    }
}