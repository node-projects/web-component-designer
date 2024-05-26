import { expect, test } from '@jest/globals';
import { calculateSpecificity } from '../dist/elements/services/stylesheetService/SpecificityCalculator';

test('test 1', () => {
    const res = calculateSpecificity('#aa');
    expect(res.A).toBe(1);
    expect(res.B).toBe(0);
    expect(res.C).toBe(0);
});

test('test 2', () => {
    const res = calculateSpecificity('#aa:is(bb,cc:hover)');
    expect(res.A).toBe(1);
    expect(res.B).toBe(1);
    expect(res.C).toBe(1);
});

test('test 3', () => {
    const res = calculateSpecificity(':host(#aa)');
    expect(res.A).toBe(1);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 4', () => {
    const res = calculateSpecificity('div:hover:selected');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2);
    expect(res.C).toBe(1);
});

test('test 5', () => {
    const res = calculateSpecificity(':host .grain ');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2);
    expect(res.C).toBe(0);
});

test('test 6', () => {
    const res = calculateSpecificity(':host .center .outer_two__piece:nth-of-type(2)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(4);
    expect(res.C).toBe(0);
});

test('test 7', () => {
    const res = calculateSpecificity('a[lang|="en"]');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(1);
});

test('test 8', () => {
    const res = calculateSpecificity('div:not(.awesome)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(1);
});

test('test 9', () => {
    const res = calculateSpecificity('div:where(#aa)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(1);
});

test('test 10', () => {
    const res = calculateSpecificity('*.aa:is(button, button.cc#bb):hover');
    expect(res.A).toBe(1);
    expect(res.B).toBe(3);
    expect(res.C).toBe(1);
});