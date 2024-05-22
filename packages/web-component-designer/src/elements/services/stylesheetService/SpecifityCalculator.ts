export type Level = "A" | "B" | "C";

export type Specificity = Record<Level, number>;

enum ParseState {
    none = 0,
    parseName = 1,
    parseAttribute = 2,
    parseInFunc = 3,
}

//todo special cases: 
//:not :is :has = inner selector specifity
//:where = 0 specifity
//:nth-child :nth-last-child = inner sel. ?

export function calculateSpecifity(selector: string): Specificity {
    let s: Specificity = { A: 0, B: 0, C: 0 }
    let parseState = ParseState.none;
    for (let n = 0; n < selector.length; n++) {
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
                    parseState = ParseState.parseInFunc;
                    break;
                case ':':
                    if (selector[n + 1] !== ':') {
                        s.B++;
                        parseState = ParseState.parseName;
                    } else {
                        s.C++;
                        parseState = ParseState.parseName;
                        n++;
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

    return s;
}