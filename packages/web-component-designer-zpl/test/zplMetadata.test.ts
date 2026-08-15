import { describe, expect, test } from '@jest/globals';
import { createHiddenZplComments, decodeHiddenZplComments, tokenizeZpl } from '../src/services/hiddenMetadata.js';

describe('ZPL tokenizer and hidden metadata', () => {
    test('tokenizes commands without splitting their field content', () => {
        const tokens = tokenizeZpl('~DGR:IMG.GRF,1,1,80^XA^FO10,20^A0N,30,30^FDHello, world^FS^XZ');
        expect(tokens.map(token => token.command)).toEqual(['DG', 'XA', 'FO', 'A0', 'FD', 'FS', 'XZ']);
        expect(tokens.find(token => token.command === 'FD')?.data).toBe('Hello, world');
    });

    test('keeps DataMatrix immediate escape sequences inside field data', () => {
        const tokens = tokenizeZpl('^XA^BXN,4,200,,,,~^FD~101ABC~d029XYZ^FS^XZ');
        expect(tokens.find(token => token.command === 'FD')?.data).toBe('~101ABC~d029XYZ');
    });

    test('round-trips chunked UTF-8 mini-ZPL', () => {
        const miniZpl = `^XA^FO4,5^A0N,30,30^FD${'Grüße 世界 '.repeat(180)}^FS^XZ`;
        const comments = createHiddenZplComments(3, miniZpl);
        expect(comments.length).toBeGreaterThan(1);
        expect(decodeHiddenZplComments(comments.join('\n'))).toEqual([{ index: 3, zpl: miniZpl }]);
    });

    test('leaves incomplete or malformed metadata undecoded', () => {
        const comments = createHiddenZplComments(1, `^XA^FD${'x'.repeat(2000)}^FS^XZ`);
        expect(decodeHiddenZplComments(comments.slice(1).join('\n'))).toEqual([]);
        expect(decodeHiddenZplComments('^FXNODEPROJECTS-HIDDEN-V1:0:1/1:not+base64^FS')).toEqual([]);
    });
});
