import { Specificity } from "@node-projects/web-component-designer";

const calculateSpecificityOfSelectorObject = (selectorObj) => {
    // https://www.w3.org/TR/selectors-4/#specificity-rules
    const specificity : Specificity = { A : 0, B : 0, C: 0};

    selectorObj.children.forEach((child) => {
        switch (child.type) {
            case 'IdSelector':
                specificity.A += 1;
                break;

            case 'AttributeSelector':
            case 'ClassSelector':
                specificity.B += 1;
                break;

            case 'PseudoClassSelector':
                switch (child.name.toLowerCase()) {
                    // “The specificity of a :where() pseudo-class is replaced by zero.”
                    case 'where':
                        // Noop :)
                        break;

                    // “The specificity of an :is(), :not(), or :has() pseudo-class is replaced by the specificity of the most specific complex selector in its selector list argument.“
                    case 'is':
                    case 'matches':
                    case 'any':
                    case 'not':
                    case 'has':
                        if (child.children) {
                            // Calculate Specificity from nested SelectorList
                            const max1 = max(...calculate(child.children.first));

                            // Adjust orig specificity
                            specificity.A += max1.a;
                            specificity.B += max1.b;
                            specificity.C += max1.c;
                        }

                        break;

                    // “The specificity of an :nth-child() or :nth-last-child() selector is the specificity of the pseudo class itself (counting as one pseudo-class selector) plus the specificity of the most specific complex selector in its selector list argument”
                    case 'nth-child':
                    case 'nth-last-child':
                        specificity.B += 1;

                        if (child.children.first.selector) {
                            // Calculate Specificity from SelectorList
                            const max2 = max(...calculate(child.children.first.selector));

                            // Adjust orig specificity
                            specificity.A += max2.a;
                            specificity.B += max2.b;
                            specificity.C += max2.c;
                        }
                        break;

                    // “The specificity of :host is that of a pseudo-class. The specificity of :host() is that of a pseudo-class, plus the specificity of its argument.”
                    // “The specificity of :host-context() is that of a pseudo-class, plus the specificity of its argument.”
                    case 'host-context':
                    case 'host':
                        specificity.B += 1;

                        if (child.children) {
                            // Workaround to a css-tree bug in which it allows complex selectors instead of only compound selectors
                            // We work around it by filtering out any Combinator and successive Selectors
                            const childAST = { type: 'Selector', children: [] };
                            let foundCombinator = false;
                            // @ts-ignore
                            child.children.first.children.forEach((entry) => {
                                if (foundCombinator) return false;
                                if (entry.type === 'Combinator') {
                                    foundCombinator = true;
                                    return false;
                                }
                                childAST.children.push(entry);
                            });

                            // Calculate Specificity from Selector
                            const childSpecificity = calculate(childAST)[0];

                            // Adjust orig specificity
                            specificity.A += childSpecificity.A;
                            specificity.B += childSpecificity.B;
                            specificity.C += childSpecificity.C;
                        }
                        break;

                    // Improper use of Pseudo-Class Selectors instead of a Pseudo-Element
                    // @ref https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements#index
                    case 'after':
                    case 'before':
                    case 'first-letter':
                    case 'first-line':
                        specificity.C += 1;
                        break;

                    default:
                        specificity.B += 1;
                        break;
                }
                break;

            case 'PseudoElementSelector':
                switch (child.name) {
                    // “The specificity of ::slotted() is that of a pseudo-element, plus the specificity of its argument.”
                    case 'slotted':
                        specificity.C += 1;

                        if (child.children) {
                            // Workaround to a css-tree bug in which it allows complex selectors instead of only compound selectors
                            // We work around it by filtering out any Combinator and successive Selectors
                            const childAST = { type: 'Selector', children: [] };
                            let foundCombinator = false;
                            // @ts-ignore
                            child.children.first.children.forEach((entry) => {
                                if (foundCombinator) return false;
                                if (entry.type === 'Combinator') {
                                    foundCombinator = true;
                                    return false;
                                }
                                childAST.children.push(entry);
                            });

                            // Calculate Specificity from Selector
                            const childSpecificity = calculate(childAST)[0];

                            // Adjust orig specificity
                            specificity.A += childSpecificity.A;
                            specificity.B += childSpecificity.B;
                            specificity.C += childSpecificity.C;
                        }
                        break;

                    default:
                        specificity.C += 1;
                        break;
                }
                break;

            case 'TypeSelector':
                // Omit namespace
                let typeSelector = child.name;
                if (typeSelector.includes('|')) {
                    typeSelector = typeSelector.split('|')[1];
                }

                // “Ignore the universal selector”
                if (typeSelector !== '*') {
                    specificity.C += 1;
                }
                break;

            default:
                // NOOP
                break;
        }
    });

    return specificity;
};

const calculate = (selectorAST) => {
    // Quit while you're ahead
    if (!selectorAST) {
        return [];
    }

    // Selector?
    if (selectorAST.type === 'Selector')
        return [calculateSpecificityOfSelectorObject(selectorAST)];

    // SelectorList?
    // ~> Calculate Specificity for each contained Selector
    if (selectorAST.type === 'SelectorList') {
        const specificities : Specificity[] = [] ;
        selectorAST.children.forEach((selector) => {
            const specificity = calculateSpecificityOfSelectorObject(selector);
            specificities.push(specificity);
        });
        return specificities;
    }

    return null;
};

const max = (...specificities) => {
    const sorted = sort(specificities);
    return sorted[0];
};

const sort = (specificities) => {
    const sorted = specificities.sort(compare);
    return sorted.reverse();
};

const compare = (s1, s2) => {
    if (s1.a === s2.a) {
        if (s1.b === s2.b) {
            return s1.c - s2.c;
        }
        return s1.b - s2.b;
    }
    return s1.a - s2.a;
};

export { calculate };