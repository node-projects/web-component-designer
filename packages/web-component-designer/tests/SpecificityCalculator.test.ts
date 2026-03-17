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

test('test 11', () => {
    const res = calculateSpecificity('button:not(:nth-child(2))');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(1);
});

test('test 12', () => {
    const res = calculateSpecificity(':nth-child(2 of .a, #b)');
    expect(res.A).toBe(1);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 13', () => {
    const res = calculateSpecificity(':where(#id, .class)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(0);
});

test('test 14 - escaped class', () => {
    const res = calculateSpecificity('.\\31 23');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 15 - escaped id', () => {
    const res = calculateSpecificity('#\\#id');
    expect(res.A).toBe(1);
    expect(res.B).toBe(0);
    expect(res.C).toBe(0);
});

test('test 16 - attribute with closing bracket in string', () => {
    const res = calculateSpecificity('[data="a]b"]');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 17 - attribute with parentheses in string', () => {
    const res = calculateSpecificity('[data="(test)"]');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 18 - nth-child with of class', () => {
    const res = calculateSpecificity(':nth-child(2 of .a)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2); // nth-child + .a
    expect(res.C).toBe(0);
});

test('test 19 - nth-child with of id', () => {
    const res = calculateSpecificity(':nth-child(2 of #a)');
    expect(res.A).toBe(1);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 20 - nth-child with selector list', () => {
    const res = calculateSpecificity(':nth-child(2 of .a, #b)');
    expect(res.A).toBe(1); // max(#b)
    expect(res.B).toBe(1); // nth-child
    expect(res.C).toBe(0);
});

test('test 21 - nth-child with whitespace', () => {
    const res = calculateSpecificity(':nth-child(2    of    .a)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2);
    expect(res.C).toBe(0);
});

test('test 22 - nth-child without of', () => {
    const res = calculateSpecificity(':nth-child(2)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 23 - nested strings and brackets', () => {
    const res = calculateSpecificity('[data="a(b[c]d)e"]');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1);
    expect(res.C).toBe(0);
});

test('test 24 - namespaced element', () => {
    const res = calculateSpecificity('svg|rect');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(1);
});

test('test 25 - universal with namespace', () => {
    const res = calculateSpecificity('*|div');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(1);
});

test('test 26 - empty namespace', () => {
    const res = calculateSpecificity('|div');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(1);
});

test('test 27 - pseudo-element with args ::part', () => {
    const res = calculateSpecificity('::part(button)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(1);
});

test('test 28 - pseudo-element with args ::slotted', () => {
    const res = calculateSpecificity('::slotted(span)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(1);
});

test('test 29 - combined namespace + pseudo-element', () => {
    const res = calculateSpecificity('svg|rect::part(foo)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(2); // rect + ::part
});

test('test 30 - multiple pseudo-elements', () => {
    const res = calculateSpecificity('::slotted(span)::part(button)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(2);
});

test('test 31 - multiple pseudo-classes', () => {
    const res = calculateSpecificity('div.class1.class2:hover:focus');
    expect(res.A).toBe(0); // no ID
    expect(res.B).toBe(3); // 2 classes + :hover + :focus
    expect(res.C).toBe(1); // div type selector
});

test('test 32 - pseudo-element and class', () => {
    const res = calculateSpecificity('p::before.highlight');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1); // .highlight
    expect(res.C).toBe(2); // p + ::before
});

test('test 33 - nested :is() and :not()', () => {
    const res = calculateSpecificity(':is(.a, #b):not(.c)');
    expect(res.A).toBe(1); // max of #b
    expect(res.B).toBe(1); // .c
    expect(res.C).toBe(0);
});

test('test 34 - complex descendant combinators', () => {
    const res = calculateSpecificity('ul li .item > a#link:hover');
    expect(res.A).toBe(1); // #link
    expect(res.B).toBe(2); // .item + :hover
    expect(res.C).toBe(3); // ul + li + a
});

test('test 35 - attribute selectors', () => {
    const res = calculateSpecificity('[data-id="123"].active');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2); // [attr] + .active
    expect(res.C).toBe(0);
});

test('test 36 - multiple pseudo-elements', () => {
    const res = calculateSpecificity('div::first-line::after');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(3); // div + ::first-line + ::after
});

test('test 37 - universal selector with class', () => {
    const res = calculateSpecificity('*[role="button"].btn');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2); // [role] + .btn
    expect(res.C).toBe(0); // universal selector doesn't count
});

test('test 38 - nested :has()', () => {
    const res = calculateSpecificity('div:has(> span.highlight, a#link)');
    expect(res.A).toBe(1); // #link
    expect(res.B).toBe(1); // .highlight
    expect(res.C).toBe(1); // div
});

test('test 39 - :where() does not increase specificity', () => {
    const res = calculateSpecificity(':where(.a, #b)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(0);
});

test('test 40 - type selector and namespace', () => {
    const res = calculateSpecificity('svg|circle.special');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1); // .special
    expect(res.C).toBe(1); // circle type
});

test('test 41 - multiple combinators and pseudo-elements', () => {
    const res = calculateSpecificity('header nav > ul li::after');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(5); // header + nav + ul + li + ::after
});

test('test 42 - :nth-last-child with of selector list', () => {
    const res = calculateSpecificity(':nth-last-child(3 of .x, #y, a)');
    expect(res.A).toBe(1); // max from #y
    expect(res.B).toBe(1); // nth-last-child itself
    expect(res.C).toBe(0);
});

test('test 43 - escaping in identifiers', () => {
    const res = calculateSpecificity('.class\\#escaped #id\\:special');
    expect(res.A).toBe(1); // #id\:special
    expect(res.B).toBe(1); // .class\#escaped
    expect(res.C).toBe(0);
});

test('test 44 - nested functional pseudo-classes', () => {
    const res = calculateSpecificity(':is(:not(.a), :has(#b))');
    expect(res.A).toBe(1); // #b
    expect(res.B).toBe(1); // .a
    expect(res.C).toBe(0);
});

test('test 45 - complex all together', () => {
    const res = calculateSpecificity('body > header.navbar :is(ul li:first-child, a#link.active):hover');
    expect(res.A).toBe(1); // #link
    expect(res.B).toBe(3); // .navbar + .active + :hover
    expect(res.C).toBe(5); // body + header + ul + li + first-child
});

test('test 46 - deeply nested :is() and :not()', () => {
    const res = calculateSpecificity(':is(:not(.a, #b), .c)');
    expect(res.A).toBe(1); // #b
    expect(res.B).toBe(2); // .a + .c
    expect(res.C).toBe(0);
});

test('test 47 - multiple combinators with pseudo-classes', () => {
    const res = calculateSpecificity('div > ul li:first-child.active + a:hover');
    expect(res.A).toBe(0);
    expect(res.B).toBe(3); // .active + :first-child + :hover
    expect(res.C).toBe(4); // div + ul + li + a
});

test('test 48 - :slotted pseudo-class', () => {
    const res = calculateSpecificity(':slotted(.item#id)');
    expect(res.A).toBe(1); // #id
    expect(res.B).toBe(1); // .item
    expect(res.C).toBe(0);
});

test('test 49 - :host() pseudo-class', () => {
    const res = calculateSpecificity(':host(.container)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1); // .container
    expect(res.C).toBe(0);
});

test('test 50 - :host-context() pseudo-class', () => {
    const res = calculateSpecificity(':host-context(#parent) .child');
    expect(res.A).toBe(1); // #parent
    expect(res.B).toBe(1); // .child
    expect(res.C).toBe(0);
});

test('test 51 - multiple pseudo-elements in chain', () => {
    const res = calculateSpecificity('div::first-letter::after');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(3); // div + ::first-letter + ::after
});

test('test 52 - universal + class + pseudo', () => {
    const res = calculateSpecificity('*:hover.active');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2); // .active + :hover
    expect(res.C).toBe(0); // * doesn't count
});

test('test 53 - type + class + attribute', () => {
    const res = calculateSpecificity('button.btn[type="submit"]');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2); // .btn + [type]
    expect(res.C).toBe(1); // button
});

test('test 54 - deeply nested :has()', () => {
    const res = calculateSpecificity('div:has(ul li:first-child, a#link)');
    expect(res.A).toBe(1); // #link
    expect(res.B).toBe(1); // :first-child counts as pseudo-class
    expect(res.C).toBe(1); // div
});

test('test 55 - multiple :where()', () => {
    const res = calculateSpecificity(':where(.a, #b):where(.c, div)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(0);
    expect(res.C).toBe(0);
});

test('test 56 - type selector + namespace', () => {
    const res = calculateSpecificity('html|body main|article.section');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1); // .section
    expect(res.C).toBe(3); // body + article + main
});

test('test 57 - multiple descendant combinators', () => {
    const res = calculateSpecificity('header nav ul li a.link:hover');
    expect(res.A).toBe(0);
    expect(res.B).toBe(2); // .link + :hover
    expect(res.C).toBe(5); // header + nav + ul + li + a
});

test('test 58 - :not() with type + class', () => {
    const res = calculateSpecificity(':not(div.item)');
    expect(res.A).toBe(0);
    expect(res.B).toBe(1); // .item
    expect(res.C).toBe(1); // div
});

test('test 59 - :is() inside :has()', () => {
    const res = calculateSpecificity('section:has(:is(.a, #b))');
    expect(res.A).toBe(1); // #b
    expect(res.B).toBe(1); // .a
    expect(res.C).toBe(1); // section
});

test('test 60 - multiple functional pseudo-classes', () => {
    const res = calculateSpecificity(':not(:is(.a, #b)):has(.c)');
    expect(res.A).toBe(1); // #b
    expect(res.B).toBe(2); // .a + .c
    expect(res.C).toBe(0);
});
