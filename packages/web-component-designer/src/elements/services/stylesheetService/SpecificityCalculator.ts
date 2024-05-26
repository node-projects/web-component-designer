export type Level = "A" | "B" | "C";

export type Specificity = Record<Level, number>;

enum ParseState {
    none = 0,
    parseName = 1,
    parseAttribute = 2,
    parseInFunc = 3,
    parseNameOrPseudo = 4,
}

export function calculateSpecificity(selector: string): Specificity {
    return calculateSpecificityInternal(selector, 0)[0];
}

function calculateSpecificityInternal(selector: string, startIndex: number): [Specificity, number] {
    let s: Specificity = { A: 0, B: 0, C: 0 }
    let parseState = ParseState.none;
    for (let n = startIndex; n < selector.length; n++) {
        let c = selector[n];

        if (parseState === ParseState.parseInFunc) {
            if (c == ')') {
                parseState = ParseState.none;
            }
        } else if (parseState === ParseState.parseAttribute) {
            if (c == ']') {
                parseState = ParseState.none;
            }
        } else {
            switch (c) {
                case '#':
                    s.A++;
                    parseState = ParseState.parseName;
                    break;
                case '.':
                    s.B++;
                    parseState = ParseState.parseName;
                    break;
                case '[':
                    s.B++;
                    parseState = ParseState.parseAttribute;
                    break;
                case '(':
                    break;
                case ')':
                    return [s, n];
                case ',':
                    return [s, n];
                case ':':
                    if (selector[n + 1] === ':') {
                        s.C++;
                        parseState = ParseState.parseName;
                    } else {
                        if (selector.substring(n + 1, n + 4) === 'is(') {
                            parseState = ParseState.none;
                            n += 4;
                            const res = getMaxSpecificityFromSelectorList(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 5) === 'has(') {
                            n += 5;
                            const res = getMaxSpecificityFromSelectorList(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 5) === 'not(') {
                            n += 5;
                            const res = getMaxSpecificityFromSelectorList(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 11) === 'nth-child(') {
                            s.B++;
                            n += 11;
                            const res = getMaxSpecificityFromSelectorList(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 16) === 'nth-last-child(') {
                            s.B++;
                            n += 16;
                            const res = getMaxSpecificityFromSelectorList(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 6) === 'host(') {
                            s.B++;
                            n += 6;
                            const res = calculateSpecificityInternal(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 14) === 'host-context(') {
                            s.B++;
                            n += 14;
                            const res = calculateSpecificityInternal(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 9) === 'slotted(') {
                            s.B++;
                            n += 9;
                            const res = calculateSpecificityInternal(selector, n);
                            n = res[1];
                            s.A += res[0].A;
                            s.B += res[0].B;
                            s.C += res[0].C;
                        } else if (selector.substring(n + 1, n + 7) === 'where(') { //where does not add specificity
                            parseState = ParseState.parseInFunc;
                            n += 7;
                        } else {
                            s.B++;
                            parseState = ParseState.parseName;
                            n++;
                        }
                    }
                    break;
                case '>':
                case ' ':
                case '~':
                case '+':
                    parseState = ParseState.none;
                    break;
                case '*':
                    break;
                default:
                    if (parseState === ParseState.none) {
                        s.C++;
                        parseState = ParseState.parseName;
                    }
            }
        }
    }

    return [s, selector.length];
}

function getMaxSpecificityFromSelectorList(selector: string, startIndex: number): [Specificity, number] {
    let idx = startIndex;
    let s: Specificity = null;
    while (s === null || selector[idx] === ',') {
        if (selector[idx] === ',')
            idx++;
        const res = calculateSpecificityInternal(selector, idx);
        if (res[1] > idx)
            idx = res[1];
        else
            return [s, 0];
        if (s == null || res[0].A > s.A || (res[0].A === s.A && res[0].B > s.B) || (res[0].A === s.A && res[0].B === s.B && res[0].C > s.C))
            s = res[0];
    }
    return [s, idx];
}