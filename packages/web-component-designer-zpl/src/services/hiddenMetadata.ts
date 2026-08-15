export interface ZplToken {
    prefix: '^' | '~';
    command: string;
    data: string;
}

export interface HiddenPayload {
    index: number;
    zpl: string;
    comments: Set<string>;
}

const hiddenPrefix = 'NODEPROJECTS-HIDDEN-V1:';
const hiddenChunkSize = 1024;

function findCommandStart(source: string, from: number, includeTilde = true): number {
    for (let index = from; index + 2 < source.length; index++) {
        const prefix = source[index];
        if (prefix !== '^' && (!includeTilde || prefix !== '~')) continue;
        if (/^[A-Za-z0-9]{2}$/.test(source.slice(index + 1, index + 3))) return index;
    }
    return -1;
}

export function tokenizeZpl(source: string): ZplToken[] {
    const tokens: ZplToken[] = [];
    let index = 0;
    while (index < source.length) {
        const start = findCommandStart(source, index);
        if (start < 0 || start + 2 >= source.length) break;
        const prefix = source[start] as '^' | '~';
        const command = source.slice(start + 1, start + 3).toUpperCase();
        // Tilde sequences such as ~1 and ~d029 are field data for ^FD, not
        // immediate ZPL commands. Outside a field, ~DG and peers remain tokens.
        const end = findCommandStart(source, start + 3, !(prefix === '^' && command === 'FD'));
        const tokenEnd = end < 0 ? source.length : end;
        tokens.push({ prefix, command, data: source.slice(start + 3, tokenEnd).replace(/[\r\n]/g, '') });
        index = end < 0 ? source.length : end;
    }
    return tokens;
}

function encodeBase64Url(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

export function createHiddenZplComments(index: number, miniZpl: string): string[] {
    const payload = encodeBase64Url(miniZpl);
    const total = Math.max(1, Math.ceil(payload.length / hiddenChunkSize));
    const comments: string[] = [];
    for (let part = 0; part < total; part++) {
        comments.push(`^FX${hiddenPrefix}${index}:${part + 1}/${total}:${payload.slice(part * hiddenChunkSize, (part + 1) * hiddenChunkSize)}^FS`);
    }
    return comments;
}

export function hiddenPayloads(tokens: ZplToken[]): HiddenPayload[] {
    const regex = /^NODEPROJECTS-HIDDEN-V1:(\d+):(\d+)\/(\d+):([A-Za-z0-9_-]+)$/;
    const groups = new Map<number, { total: number; parts: Map<number, string>; comments: Set<string>; invalid: boolean }>();
    for (const token of tokens) {
        if (token.prefix !== '^' || token.command !== 'FX') continue;
        const match = token.data.match(regex);
        if (!match) continue;
        const index = Number(match[1]);
        const part = Number(match[2]);
        const total = Number(match[3]);
        if (!Number.isInteger(index) || part < 1 || total < 1 || part > total) continue;
        const group = groups.get(index) ?? { total, parts: new Map(), comments: new Set(), invalid: false };
        if (group.total !== total || group.parts.has(part)) {
            group.invalid = true;
            groups.set(index, group);
            continue;
        }
        group.parts.set(part, match[4]);
        group.comments.add(token.data);
        groups.set(index, group);
    }
    const result: HiddenPayload[] = [];
    for (const [index, group] of groups) {
        if (group.invalid || group.parts.size !== group.total) continue;
        try {
            const encoded = Array.from({ length: group.total }, (_, part) => group.parts.get(part + 1) ?? '').join('');
            const zpl = decodeBase64Url(encoded);
            if (!zpl.includes('^XA') || !zpl.includes('^XZ')) continue;
            result.push({ index, zpl, comments: group.comments });
        } catch { /* malformed metadata remains an ordinary comment */ }
    }
    return result.sort((a, b) => a.index - b.index);
}

export function decodeHiddenZplComments(source: string): { index: number; zpl: string }[] {
    return hiddenPayloads(tokenizeZpl(source)).map(({ index, zpl }) => ({ index, zpl }));
}
