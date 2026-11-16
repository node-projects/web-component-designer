/** @jest-environment jsdom */
import { expect, test } from '@jest/globals';
import { mergeCollaborationHtml } from '../src/mergeCollaborationHtml.js';
import { collaborationHtmlSignature } from '../src/collaborationHtmlSignature.js';

function result(base: string, incoming: string, accepted: string) {
  const element = document.createElement('div'); element.innerHTML = mergeCollaborationHtml(base, incoming, accepted); return element;
}

test('merges independent properties of the same element and uses the incoming edit for overlaps', () => {
  const base = '<div id="a" style="left:10px;top:20px" title="old"></div>';
  const merged = result(base, '<div id="a" style="left:30px;top:20px" title="new"></div>',
    '<div id="a" style="left:25px;top:40px" title="old"></div>').firstElementChild as HTMLElement;
  expect(merged.style.left).toBe('30px'); expect(merged.style.top).toBe('40px'); expect(merged.title).toBe('new');
});

test('keeps independent inserted elements and resolves a delete/edit overlap using the incoming edit', () => {
  const base = '<div id="a"></div>';
  expect([...result(base, base + '<span id="b"></span>', base + '<span id="c"></span>').children].map(e => e.id)).toEqual(['a', 'b', 'c']);
  expect(result(base, '', '<div id="a" title="changed"></div>').children).toHaveLength(0);
  expect(result(base, '<div id="a" title="changed"></div>', '').firstElementChild?.getAttribute('title')).toBe('changed');
});

test('merges source text with canvas attributes while retaining SVG names and namespaces', () => {
  const base = '<svg id="s" viewBox="0 0 100 100"><clipPath id="c"><rect id="r" width="10"/></clipPath><text id="t">old</text></svg>';
  const merged = result(base, base.replace('>old<', '>new<'), base.replace('width="10"', 'width="20"'));
  expect(merged.querySelector('text')?.textContent).toBe('new');
  expect(merged.querySelector('rect')?.getAttribute('width')).toBe('20');
  expect(merged.querySelector('clipPath')?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  expect(merged.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 100 100');
});

test('retains template contents when another canvas property changes', () => {
  const base = '<div id="a" title="old"></div><template id="t"><span id="inside">old</span></template>';
  const merged = result(base, base.replace('>old<', '>new<'), base.replace('title="old"', 'title="new"'));
  expect(merged.querySelector('#a')?.getAttribute('title')).toBe('new');
  expect(merged.querySelector('template')?.content.querySelector('#inside')?.textContent).toBe('new');
});

test('merges stable siblings with duplicate legacy IDs without pausing collaboration', () => {
  const base = '<div id="a" title="one"></div><div id="a" title="two"></div>';
  const merged = result(base, base.replace('title="one"', 'title="first edit"'), base.replace('title="two"', 'title="second edit"'));
  expect([...merged.children].map(element => element.getAttribute('title'))).toEqual(['first edit', 'second edit']);
});

test('equivalent serialization orders converge while real text, geometry and stacking edits remain different', () => {
  const base = '<div id="a" title="A" style="left:10px;top:20px">Text</div><div id="b"></div>';
  expect(collaborationHtmlSignature(base)).toBe(collaborationHtmlSignature('<div title="A" id="a" style="top:20px;left:10px">Text</div><div id="b"></div>'));
  for (const changed of [base.replace('10px', '30px'), base.replace('>Text<', '>New<'), '<div id="b"></div>' + base.split('<div id="b">')[0]])
    expect(collaborationHtmlSignature(changed)).not.toBe(collaborationHtmlSignature(base));
});
