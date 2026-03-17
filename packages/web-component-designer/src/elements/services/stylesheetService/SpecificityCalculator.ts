export type Level = "A" | "B" | "C";
export type Specificity = { A: number; B: number; C: number };

export function calculateSpecificity(selector: string): Specificity {
    const spec: Specificity = { A: 0, B: 0, C: 0 };
    parseSelectorList(selector, 0, spec);
    return spec;
}

function parseSelectorList(input: string, start: number, spec: Specificity): number {
    let i = start;
    let temp: Specificity = { A: 0, B: 0, C: 0 };

    while (i < input.length) {
        temp.A = temp.B = temp.C = 0;
        i = parseSelector(input, i, temp);

        // Keep the most specific selector (lexicographic comparison)
        if (temp.A > spec.A || (temp.A === spec.A && (temp.B > spec.B || (temp.B === spec.B && temp.C > spec.C)))) {
            spec.A = temp.A;
            spec.B = temp.B;
            spec.C = temp.C;
        }

        if (input[i] === ',') i++;
        else break;
    }

    return i;
}

function parseSelector(input: string, start: number, spec: Specificity): number {
    let i = start;

    while (i < input.length) {
        const c = input[i];
        if (c === ',' || c === ')') break;

        if (c === ' ' || c === '>' || c === '+' || c === '~') { i++; continue; }
        if (c === '#') { i = readIdent(input, i + 1); spec.A++; continue; }
        if (c === '.') { i = readIdent(input, i + 1); spec.B++; continue; }
        if (c === '[') { i = readBalanced(input, i, '[', ']'); spec.B++; continue; }

        if (c === ':') {
            if (input[i + 1] === ':') { i += 2; i = readIdent(input, i); if (input[i] === '(') i = readBalanced(input, i, '(', ')'); spec.C++; continue; }

            const nameStart = i + 1;
            const nameEnd = readIdent(input, nameStart);
            const name = input.substring(nameStart, nameEnd);
            i = nameEnd;

            if (input[i] === '(') {
                const innerStart = i + 1;
                const innerEnd = readBalanced(input, i, '(', ')');

                switch (name) {
                    case 'where':
                        i = innerEnd; continue;

                    case 'is':
                    case 'not': {
                        const innerSpec: Specificity = { A: 0, B: 0, C: 0 };
                        let j = innerStart;
                        while (j < innerEnd - 1) {
                            const tempSpec: Specificity = { A: 0, B: 0, C: 0 };
                            j = parseSelectorList(input, j, tempSpec);

                            // Max specificity among inner selectors
                            innerSpec.A = Math.max(innerSpec.A, tempSpec.A);
                            innerSpec.B = Math.max(innerSpec.B, tempSpec.B);
                            innerSpec.C = Math.max(innerSpec.C, tempSpec.C);

                            if (input[j] === ',') j++;
                            else break;
                        }

                        spec.A += innerSpec.A;
                        spec.B += innerSpec.B;
                        spec.C += innerSpec.C;

                        i = innerEnd;
                        continue;
                    }

                    case 'has': {
                        const innerSpec: Specificity = { A: 0, B: 0, C: 0 };
                        let j = innerStart;
                        while (j < innerEnd - 1) {
                            const tempSpec: Specificity = { A: 0, B: 0, C: 0 };
                            j = parseSelectorList(input, j, tempSpec);

                            // Max specificity among inner selectors
                            if (tempSpec.A > innerSpec.A || (tempSpec.A === innerSpec.A && (tempSpec.B > innerSpec.B || (tempSpec.B === innerSpec.B && tempSpec.C > innerSpec.C)))) {
                                innerSpec.A = tempSpec.A;
                                innerSpec.B = tempSpec.B;
                                innerSpec.C = tempSpec.C;
                            }

                            if (input[j] === ',') j++;
                            else break;
                        }

                        spec.A += innerSpec.A;
                        spec.B += innerSpec.B;
                        spec.C += innerSpec.C;

                        i = innerEnd;
                        continue;
                    }

                    case 'slotted': {
                        const innerSpec: Specificity = { A: 0, B: 0, C: 0 };
                        parseSelector(input, innerStart, innerSpec);
                        spec.A += innerSpec.A;
                        spec.B += innerSpec.B;
                        spec.C += innerSpec.C;
                        i = innerEnd;
                        continue;
                    }

                    case 'host':
                    case 'host-context': {
                        spec.B++;
                        const innerSpec: Specificity = { A: 0, B: 0, C: 0 };
                        parseSelector(input, innerStart, innerSpec);
                        spec.A += innerSpec.A;
                        spec.B += innerSpec.B;
                        spec.C += innerSpec.C;
                        i = innerEnd;
                        continue;
                    }

                    case 'nth-child':
                    case 'nth-last-child': {
                        spec.B++;
                        const ofIndex = findOfKeyword(input, innerStart, innerEnd - 1);
                        if (ofIndex !== -1) {
                            let afterOf = ofIndex + 2;
                            while (afterOf < innerEnd - 1 && /\s/.test(input[afterOf])) afterOf++;

                            let maxSpec: Specificity = { A: 0, B: 0, C: 0 };
                            let j = afterOf;
                            while (j < innerEnd - 1) {
                                const tempSpec: Specificity = { A: 0, B: 0, C: 0 };
                                j = parseSelector(input, j, tempSpec);

                                if (tempSpec.A > maxSpec.A ||
                                    (tempSpec.A === maxSpec.A && tempSpec.B > maxSpec.B) ||
                                    (tempSpec.A === maxSpec.A && tempSpec.B === maxSpec.B && tempSpec.C > maxSpec.C))
                                    maxSpec = tempSpec;

                                if (input[j] === ',') j++;
                                else break;
                            }

                            spec.A += maxSpec.A;
                            spec.B += maxSpec.B;
                            spec.C += maxSpec.C;
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

        if (c === '*') { i++; continue; }
        if (isIdentStart(c) || c === '|') { while (i < input.length && (isIdentChar(input[i]) || input[i] === '|')) i++; spec.C++; continue; }

        i++;
    }

    return i;
}

/* Helpers */
function isIdentStart(c: string): boolean {
    const code = c.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || c === '_' || c === '-' || c === '\\';
}
function isIdentChar(c: string) {
    const code = c.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || c === '_' || c === '-' || c === '\\';
}
function readIdent(input: string, start: number): number {
    let i = start;
    while (i < input.length) {
        if (input[i] === '\\') { i += 2; continue; }
        if (!isIdentChar(input[i])) break;
        i++;
    }
    return i;
}
function readBalanced(input: string, start: number, open: string, close: string): number {
    let depth = 0, quote: string | null = null, i = start;
    while (i < input.length) {
        const c = input[i];
        if (quote) { if (c === '\\') { i += 2; continue; } if (c === quote) quote = null; i++; continue; }
        if (c === '"' || c === "'") { quote = c; i++; continue; }
        if (c === open) depth++;
        else if (c === close) { depth--; if (depth === 0) return i + 1; }
        i++;
    }
    return i;
}
function findOfKeyword(input: string, start: number, end: number): number {
    let i = start;
    while (i <= end - 1) {
        while (i <= end - 1 && /\s/.test(input[i])) i++;
        if (input[i] === 'o' && input[i + 1] === 'f' && (i + 2 > end - 1 || /\s|\(/.test(input[i + 2]))) return i;
        i++;
    }
    return -1;
}
