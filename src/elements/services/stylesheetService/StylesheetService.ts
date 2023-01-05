import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";
import { IStylesheetService } from "./IStylesheetService.js";

import * as csstree from 'css-tree';
import { TypedEvent } from "@node-projects/base-custom-webcomponent";

type RuleWithSpecificity = {
    rule: csstree.RulePlain,
    specificity: number,
}

export class StylesheetService implements IStylesheetService {

    stylesheet: string;
    stylesheetChanged: TypedEvent<{ stylesheet: string; }> = new TypedEvent<{ stylesheet: string; }>();

    ruleset: csstree.StyleSheetPlain;

    constructor(stylesheet: string) {
        this.stylesheet = stylesheet;
    }

    public updateDefiningRule(designItems: IDesignItem[], property: IProperty, value: string): boolean {
        let highestSpecificityRule = this.getDefiningRule(designItems, property);
        if (!highestSpecificityRule) return false;

        let newRule = csstree.toPlainObject(csstree.parse("* {" + property.name + ": " + value + "}")) as csstree.StyleSheetPlain;

        let index = this.returnRuleDeclarationIndex(highestSpecificityRule, property);
        if (index > -1) highestSpecificityRule.block.children.splice(index, 1, (newRule.children[0] as csstree.RulePlain).block.children[0]);
        else highestSpecificityRule.block.children.push((newRule.children[0] as csstree.RulePlain).block.children[0]);

        if (!this.ruleset) this.ruleset = this.parseStylesheetToRuleset(this.stylesheet);

        this.stylesheetChanged.emit({ stylesheet: csstree.generate(csstree.fromPlainObject(this.ruleset)) });
        return true;
    }

    /*
        Do we want/need the defining rule or the rule, which already applies the property to the element?
        The first one would guarantee that the property is applied to the element, 
        but the second one would also allow to change the property and results in a minified stylesheet.

        For example:

        Element:
        <button id="my-button"></button>

        Changed property:
        background-color: red;

        #my-button {
            border: 1px solid black;
        }

        button {
            background-color: white;
        }

        To make sure the property is applied to the element, we would need to return the first rule. 
        It has the highest specificity.

        To make sure the stylesheet is minified, we would need to return the second rule.
        It has a lower specificity, but we could make sure, that it is the rule, where the property is already declared,
        but has a high enough specificity to be applied to the element.
    */

    public getDefiningRule(designItems: IDesignItem[], prop: IProperty): csstree.RulePlain {
        let matches: RuleWithSpecificity[] = [];

        this.ruleset = this.parseStylesheetToRuleset(this.stylesheet);

        this.ruleset.children?.forEach((rule: csstree.RulePlain) => {
            if (designItems[0].element.matches(this.buildSelectorString(rule.prelude as csstree.SelectorListPlain))) {
                const specificity = this.getSpecificity(rule.prelude as csstree.SelectorListPlain);
                matches.push({ rule, specificity });
            }
        });

        return this.findHighestSpecificity(matches).rule;
    }

    private parseStylesheetToRuleset(stylesheet: string): csstree.StyleSheetPlain {
        return csstree.toPlainObject(csstree.parse(stylesheet, { positions: true })) as csstree.StyleSheetPlain;
    }

    private buildSelectorString(selector: csstree.SelectorListPlain): string {
        return this.stylesheet.substring(selector.loc.start.offset, selector.loc.end.offset);
    }

    private getSpecificity(selector: csstree.SelectorListPlain): number {
        return 10;
    }

    private findHighestSpecificity(rules: RuleWithSpecificity[]): RuleWithSpecificity {
        return rules.find(r => r.specificity == Math.max(...rules.map(x => x.specificity)));
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