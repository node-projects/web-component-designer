import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";
import { IStyleDeclaration, IStyleRule, IStylesheetService } from "./IStylesheetService.js";

import * as csstree from 'css-tree';
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { calculate as calculateSpecifity } from "./SpecificityCalculator.js";

type RuleWithSpecificity = {
    rule: csstree.RulePlain,
    selector: string,
    specificity: number,
}

export class StylesheetService implements IStylesheetService {

    stylesheets: string[];
    stylesheetChanged: TypedEvent<{ stylesheet: string; }> = new TypedEvent<{ stylesheet: string; }>();

    styles: RuleWithSpecificity[] = [];

    constructor(stylesheets: string[]) {
        this.stylesheets = stylesheets;
    }

    public updateDefiningRule(designItem: IDesignItem, property: IProperty, value: string): boolean {
        // let highestSpecificityRule = this.getAppliedRules(designItem, property);
        // if (!highestSpecificityRule) return false;

        // let newRule = csstree.toPlainObject(csstree.parse("* {" + property.name + ": " + value + "}")) as csstree.StyleSheetPlain;

        // let index = this.returnRuleDeclarationIndex(highestSpecificityRule, property);
        // if (index > -1) highestSpecificityRule.block.children.splice(index, 1, (newRule.children[0] as csstree.RulePlain).block.children[0]);
        // else highestSpecificityRule.block.children.push((newRule.children[0] as csstree.RulePlain).block.children[0]);

        // if (!this.ruleset) this.ruleset = this.parseStylesheetToRuleset(this.stylesheet);

        // this.stylesheetChanged.emit({ stylesheet: csstree.generate(csstree.fromPlainObject(this.ruleset)) });
        return true;
    }

    private getAppliedRulesInternal(designItem: IDesignItem, prop: IProperty): RuleWithSpecificity[] {
        return this.parseStylesheetToRuleset(this.stylesheets).filter(item => designItem.element.matches(item.selector));
    }

    public getAppliedRules(designItem: IDesignItem, prop: IProperty): IStyleRule[] {
        let rules = this.getAppliedRulesInternal(designItem, prop);
        if (!rules) return [];

        return rules.map(r => {
            return {
                selector: r.selector,
                declarations: r.rule.block.children.map(c => {
                    return {
                        // @ts-ignore
                        name: c.property,
                        // @ts-ignore
                        value: (c.value as csstree.Raw).value,
                        // @ts-ignore
                        important: c.important == true
                    }
                }),
                specificity: this.getSpecificity(r.rule.prelude as csstree.SelectorListPlain)
            }
        });
    }

    private getDeclarationInternal(designItem: IDesignItem, prop: IProperty): csstree.DeclarationPlain[] {
        let rules = this.getAppliedRulesInternal(designItem, prop);
        if (!rules) return null;

        let declarations: csstree.DeclarationPlain[] = [];
        rules.forEach(r => {
            let index = this.returnRuleDeclarationIndex(r.rule, prop);
            // @ts-ignore
            if (index > -1) declarations.push(r.rule.block.children[index]);
        });

        return declarations;
    }

    public getDeclarations(designItem: IDesignItem, prop: IProperty): IStyleDeclaration[] {
        let decl = this.getDeclarationInternal(designItem, prop);
        if (!decl) return null;

        let declarations: IStyleDeclaration[] = [];

        decl.forEach(d => {
            declarations.push({
                name: d.property,
                value: (d.value as csstree.Raw).value,
                important: d.important == true
            })
        });

        return declarations;
    }

    private parseStylesheetToRuleset(stylesheets: string[]): RuleWithSpecificity[] {
        let styles: RuleWithSpecificity[] = [];
        stylesheets.forEach(s => {
            let stylesheetPlain = csstree.toPlainObject(csstree.parse(s, { positions: true, parseValue: false })) as csstree.StyleSheetPlain;
            stylesheetPlain.children.forEach((rule: csstree.RulePlain) => {
                styles.push({
                    rule: rule,
                    selector: this.buildSelectorString(s, rule.prelude as csstree.SelectorListPlain),
                    specificity: this.getSpecificity(rule.prelude as csstree.SelectorListPlain)
                });
            });
        });

        return styles;
    }

    private buildSelectorString(stylesheet: string, selector: csstree.SelectorListPlain): string {
        return stylesheet.substring(selector.loc.start.offset, selector.loc.end.offset);
    }

    private getSpecificity(selector: csstree.SelectorListPlain): number {
        const specificities = calculateSpecifity(selector);
        let sum = 0;
        specificities.forEach(specificity => sum += specificity.a * 10000 + specificity.b * 100 + specificity.c);

        return sum;
    }

    private returnRuleDeclarationIndex(rule: csstree.RulePlain, property: IProperty): number {
        let decl: csstree.DeclarationPlain;
        rule.block.children.forEach((child: csstree.DeclarationPlain) => {
            if (child.property == property.name) {
                decl = child;
                return;
            }
        });

        if (!decl) return -1;
        return rule.block.children.indexOf(decl);
    }
}