export type Level = "A" | "B" | "C";
export type Specificity = { A: number; B: number; C: number };

// Char codes used throughout
const CH_HASH = 35;        // #
const CH_DOT = 46;         // .
const CH_COLON = 58;       // :
const CH_LBRACKET = 91;    // [
const CH_RBRACKET = 93;    // ]
const CH_LPAREN = 40;      // (
const CH_RPAREN = 41;      // )
const CH_COMMA = 44;       // ,
const CH_BACKSLASH = 92;   // \
const CH_STAR = 42;        // *
const CH_PIPE = 124;       // |
const CH_SPACE = 32;       // ' '
const CH_GT = 62;          // >
const CH_PLUS = 43;        // +
const CH_TILDE = 126;      // ~
const CH_SQUOTE = 39;      // '
const CH_DQUOTE = 34;      // "
const CH_UNDERSCORE = 95;  // _
const CH_DASH = 45;        // -

export function calculateSpecificity(selector: string): Specificity {
    const spec: Specificity = { A: 0, B: 0, C: 0 };

    // Fast path: simple selectors without pseudo-classes, attributes, functions, commas, or escapes
    if (!needsFullParse(selector)) {
        calcSimple(selector, spec);
        return spec;
    }

    parseSelectorList(selector, 0, spec);
    return spec;
}

function needsFullParse(selector: string): boolean {
    for (let i = 0; i < selector.length; i++) {
        const c = selector.charCodeAt(i);
        if (c === CH_COLON || c === CH_LBRACKET || c === CH_LPAREN || c === CH_COMMA || c === CH_BACKSLASH)
            return true;
    }
    return false;
}

function calcSimple(selector: string, spec: Specificity): void {
    const len = selector.length;
    let i = 0;
    while (i < len) {
        const c = selector.charCodeAt(i);
        // Column combinator ||
        if (c === CH_PIPE && i + 1 < len && selector.charCodeAt(i + 1) === CH_PIPE) { i += 2; continue; }
        if (c === CH_SPACE || c === CH_GT || c === CH_PLUS || c === CH_TILDE) { i++; continue; }
        if (c === CH_HASH) {
            spec.A++;
            i++;
            while (i < len && isIdentCC(selector.charCodeAt(i))) i++;
            continue;
        }
        if (c === CH_DOT) {
            spec.B++;
            i++;
            while (i < len && isIdentCC(selector.charCodeAt(i))) i++;
            continue;
        }
        if (c === CH_STAR) { i++; continue; }
        if (isIdentStartCC(c) || c === CH_PIPE) {
            while (i < len) {
                const cc = selector.charCodeAt(i);
                if (isIdentCC(cc) || cc === CH_PIPE) i++;
                else break;
            }
            spec.C++;
            continue;
        }
        i++;
    }
}

/* ---- Full parser (used when selector contains :, [, (, \, or ,) ---- */

function parseSelectorList(input: string, start: number, spec: Specificity): number {
    let i = start;
    let tA = 0, tB = 0, tC = 0;

    while (i < input.length) {
        tA = tB = tC = 0;
        i = parseSelector(input, i, spec, true);
        // parseSelector wrote into spec; grab those values as temp then reset
        tA = spec.A; tB = spec.B; tC = spec.C;

        // On the very first iteration we just keep the values.
        // On subsequent iterations we pick the most specific (lexicographic).
        // To avoid extra bookkeeping we always overwrite spec and compare below.
        if (input.charCodeAt(i) === CH_COMMA) {
            i++;
            // Need to parse more selectors — save best so far
            let bestA = tA, bestB = tB, bestC = tC;
            while (i < input.length) {
                spec.A = spec.B = spec.C = 0;
                i = parseSelector(input, i, spec, true);
                if (spec.A > bestA || (spec.A === bestA && (spec.B > bestB || (spec.B === bestB && spec.C > bestC)))) {
                    bestA = spec.A; bestB = spec.B; bestC = spec.C;
                }
                if (input.charCodeAt(i) === CH_COMMA) { i++; continue; }
                break;
            }
            spec.A = bestA; spec.B = bestB; spec.C = bestC;
        }
        break;
    }

    return i;
}

// When called from parseSelectorList with direct=true, writes directly into spec (avoids temp object).
// When called recursively (direct=false), the caller manages its own temp.
function parseSelector(input: string, start: number, spec: Specificity, direct: boolean): number {
    let i = start;
    if (direct) { spec.A = spec.B = spec.C = 0; }

    while (i < input.length) {
        const c = input.charCodeAt(i);
        if (c === CH_COMMA || c === CH_RPAREN) break;

        // Column combinator ||
        if (c === CH_PIPE && input.charCodeAt(i + 1) === CH_PIPE) { i += 2; continue; }

        if (c === CH_SPACE || c === CH_GT || c === CH_PLUS || c === CH_TILDE) { i++; continue; }
        if (c === CH_HASH) { i = readIdent(input, i + 1); spec.A++; continue; }
        if (c === CH_DOT) { i = readIdent(input, i + 1); spec.B++; continue; }
        if (c === CH_LBRACKET) { i = readBalanced(input, i, CH_LBRACKET, CH_RBRACKET); spec.B++; continue; }

        if (c === CH_COLON) {
            if (input.charCodeAt(i + 1) === CH_COLON) {
                i += 2;
                i = readIdent(input, i);
                if (input.charCodeAt(i) === CH_LPAREN) i = readBalanced(input, i, CH_LPAREN, CH_RPAREN);
                spec.C++;
                continue;
            }

            const nameStart = i + 1;
            const nameEnd = readIdent(input, nameStart);
            i = nameEnd;

            // Legacy single-colon pseudo-elements — count as C (pseudo-element), not B
            if (isLegacyPseudoElement(input, nameStart, nameEnd - nameStart)) {
                spec.C++;
                continue;
            }

            if (input.charCodeAt(i) === CH_LPAREN) {
                const innerStart = i + 1;
                const innerEnd = readBalanced(input, i, CH_LPAREN, CH_RPAREN);

                // Identify the pseudo-class by comparing chars directly (avoids substring allocation)
                const nameLen = nameEnd - nameStart;
                const pcKind = classifyPseudo(input, nameStart, nameLen);

                switch (pcKind) {
                    case PC_WHERE:
                        i = innerEnd; continue;

                    case PC_IS:
                    case PC_NOT:
                    case PC_HAS:
                    case PC_MATCHES:
                    case PC_WEBKIT_ANY:
                    case PC_MOZ_ANY: {
                        let bestA = 0, bestB = 0, bestC = 0;
                        let j = innerStart;
                        const limit = innerEnd - 1;
                        while (j < limit) {
                            const saved = { A: 0, B: 0, C: 0 };
                            j = parseSelectorInner(input, j, saved);
                            if (saved.A > bestA || (saved.A === bestA && (saved.B > bestB || (saved.B === bestB && saved.C > bestC)))) {
                                bestA = saved.A; bestB = saved.B; bestC = saved.C;
                            }
                            if (input.charCodeAt(j) === CH_COMMA) j++;
                            else break;
                        }
                        spec.A += bestA;
                        spec.B += bestB;
                        spec.C += bestC;
                        i = innerEnd;
                        continue;
                    }

                    case PC_SLOTTED: {
                        const inner: Specificity = { A: 0, B: 0, C: 0 };
                        parseSelector(input, innerStart, inner, false);
                        spec.A += inner.A;
                        spec.B += inner.B;
                        spec.C += inner.C;
                        i = innerEnd;
                        continue;
                    }

                    case PC_HOST:
                    case PC_HOST_CTX: {
                        spec.B++;
                        const inner: Specificity = { A: 0, B: 0, C: 0 };
                        parseSelector(input, innerStart, inner, false);
                        spec.A += inner.A;
                        spec.B += inner.B;
                        spec.C += inner.C;
                        i = innerEnd;
                        continue;
                    }

                    case PC_NTH_CHILD:
                    case PC_NTH_LAST: {
                        spec.B++;
                        const limit = innerEnd - 1;
                        const ofIndex = findOfKeyword(input, innerStart, limit);
                        if (ofIndex !== -1) {
                            let afterOf = ofIndex + 2;
                            while (afterOf < limit && isWhitespaceCC(input.charCodeAt(afterOf))) afterOf++;

                            let bestA = 0, bestB = 0, bestC = 0;
                            let j = afterOf;
                            while (j < limit) {
                                const ts: Specificity = { A: 0, B: 0, C: 0 };
                                j = parseSelector(input, j, ts, false);
                                if (ts.A > bestA || (ts.A === bestA && (ts.B > bestB || (ts.B === bestB && ts.C > bestC)))) {
                                    bestA = ts.A; bestB = ts.B; bestC = ts.C;
                                }
                                if (input.charCodeAt(j) === CH_COMMA) j++;
                                else break;
                            }
                            spec.A += bestA;
                            spec.B += bestB;
                            spec.C += bestC;
                        }
                        i = innerEnd;
                        continue;
                    }

                    default:
                        spec.B++;
                        i = innerEnd;
                        continue;
                }
            } else {
                spec.B++;
                continue;
            }
        }

        if (c === CH_STAR) { i++; continue; }
        if (isIdentStartCC(c) || c === CH_PIPE) {
            while (i < input.length && (isIdentCC(input.charCodeAt(i)) || input.charCodeAt(i) === CH_PIPE)) i++;
            spec.C++;
            continue;
        }

        i++;
    }

    return i;
}

// Parse a single selector within a functional pseudo-class argument (handles commas at the caller level)
function parseSelectorInner(input: string, start: number, spec: Specificity): number {
    return parseSelector(input, start, spec, false);
}

/* ---- Pseudo-class classification (avoids substring + switch on string) ---- */

const PC_OTHER = 0;
const PC_WHERE = 1;
const PC_IS = 2;
const PC_NOT = 3;
const PC_HAS = 4;
const PC_SLOTTED = 5;
const PC_HOST = 6;
const PC_HOST_CTX = 7;
const PC_NTH_CHILD = 8;
const PC_NTH_LAST = 9;
const PC_MATCHES = 10;
const PC_WEBKIT_ANY = 11;
const PC_MOZ_ANY = 12;

function classifyPseudo(input: string, start: number, len: number): number {
    // Most common first
    if (len === 5 && input.charCodeAt(start) === 119) { // 'w'here
        if (input.charCodeAt(start + 1) === 104 && input.charCodeAt(start + 2) === 101 &&
            input.charCodeAt(start + 3) === 114 && input.charCodeAt(start + 4) === 101) return PC_WHERE;
    }
    if (len === 3 && input.charCodeAt(start) === 110) { // 'n'ot
        if (input.charCodeAt(start + 1) === 111 && input.charCodeAt(start + 2) === 116) return PC_NOT;
    }
    if (len === 2 && input.charCodeAt(start) === 105) { // 'i's
        if (input.charCodeAt(start + 1) === 115) return PC_IS;
    }
    if (len === 3 && input.charCodeAt(start) === 104) { // 'h'as / 'h'ost
        if (input.charCodeAt(start + 1) === 97 && input.charCodeAt(start + 2) === 115) return PC_HAS;
    }
    if (len === 4 && input.charCodeAt(start) === 104) { // 'h'ost
        if (input.charCodeAt(start + 1) === 111 && input.charCodeAt(start + 2) === 115 &&
            input.charCodeAt(start + 3) === 116) return PC_HOST;
    }
    if (len === 12 && input.charCodeAt(start) === 104) { // host-context
        if (input.charCodeAt(start + 4) === CH_DASH && input.charCodeAt(start + 5) === 99) {
            // Quick check first+last chars, then full
            if (input.substring(start, start + len) === 'host-context') return PC_HOST_CTX;
        }
    }
    if (len === 7 && input.charCodeAt(start) === 115) { // slotted
        if (input.substring(start, start + 7) === 'slotted') return PC_SLOTTED;
    }
    if (len === 9 && input.charCodeAt(start) === 110) { // nth-child
        if (input.substring(start, start + 9) === 'nth-child') return PC_NTH_CHILD;
    }
    if (len === 14 && input.charCodeAt(start) === 110) { // nth-last-child
        if (input.substring(start, start + 14) === 'nth-last-child') return PC_NTH_LAST;
    }
    if (len === 7 && input.charCodeAt(start) === 109) { // matches
        if (input.substring(start, start + 7) === 'matches') return PC_MATCHES;
    }
    if (len === 11 && input.charCodeAt(start) === CH_DASH) { // -webkit-any
        if (input.substring(start, start + 11) === '-webkit-any') return PC_WEBKIT_ANY;
    }
    if (len === 8 && input.charCodeAt(start) === CH_DASH) { // -moz-any
        if (input.substring(start, start + 8) === '-moz-any') return PC_MOZ_ANY;
    }
    return PC_OTHER;
}

// Legacy single-colon pseudo-elements that should count as C, not B
function isLegacyPseudoElement(input: string, start: number, len: number): boolean {
    if (len === 6) { // before / after
        const c0 = input.charCodeAt(start);
        if (c0 === 98) return input.substring(start, start + 6) === 'before'; // 'b'efore
        if (c0 === 97) return input.substring(start, start + 6) === 'after';  // 'a'fter (5 chars, won't match — handled below)
    }
    if (len === 5 && input.charCodeAt(start) === 97) { // after
        return input.substring(start, start + 5) === 'after';
    }
    if (len === 10 && input.charCodeAt(start) === 102) { // first-line
        return input.substring(start, start + 10) === 'first-line';
    }
    if (len === 12 && input.charCodeAt(start) === 102) { // first-letter
        return input.substring(start, start + 12) === 'first-letter';
    }
    return false;
}

/* ---- Character classification (charCode-based, no string allocation) ---- */

function isIdentStartCC(code: number): boolean {
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === CH_UNDERSCORE || code === CH_DASH || code === CH_BACKSLASH;
}

function isIdentCC(code: number): boolean {
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code === CH_UNDERSCORE || code === CH_DASH || code === CH_BACKSLASH;
}

function isWhitespaceCC(code: number): boolean {
    return code === 32 || code === 9 || code === 10 || code === 13 || code === 12;
}

function readIdent(input: string, start: number): number {
    let i = start;
    while (i < input.length) {
        const cc = input.charCodeAt(i);
        if (cc === CH_BACKSLASH) { i += 2; continue; }
        if (!isIdentCC(cc)) break;
        i++;
    }
    return i;
}

function readBalanced(input: string, start: number, open: number, close: number): number {
    let depth = 0, inQuote = 0, i = start;
    while (i < input.length) {
        const c = input.charCodeAt(i);
        if (inQuote) {
            if (c === CH_BACKSLASH) { i += 2; continue; }
            if (c === inQuote) inQuote = 0;
            i++;
            continue;
        }
        if (c === CH_DQUOTE || c === CH_SQUOTE) { inQuote = c; i++; continue; }
        if (c === open) depth++;
        else if (c === close) { depth--; if (depth === 0) return i + 1; }
        i++;
    }
    return i;
}

function findOfKeyword(input: string, start: number, end: number): number {
    let i = start;
    while (i <= end - 1) {
        while (i <= end - 1 && isWhitespaceCC(input.charCodeAt(i))) i++;
        if (input.charCodeAt(i) === 111 && input.charCodeAt(i + 1) === 102 && // 'o','f'
            (i + 2 > end - 1 || isWhitespaceCC(input.charCodeAt(i + 2)) || input.charCodeAt(i + 2) === CH_LPAREN))
            return i;
        i++;
    }
    return -1;
}
