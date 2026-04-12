import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from '@jest/globals';

const camelToDashCase = (text: string) => text.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);

const compressBoxValues = (top: string, right: string, bottom: string, left: string) => {
  if (top === right && top === bottom && top === left)
    return top;
  if (top === bottom && right === left)
    return `${top} ${right}`;
  if (right === left)
    return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
};

const expandBoxValues = (value: string) => {
  const values = value.trim().split(/\s+/);
  if (values.length === 1)
    return [values[0], values[0], values[0], values[0]];
  if (values.length === 2)
    return [values[0], values[1], values[0], values[1]];
  if (values.length === 3)
    return [values[0], values[1], values[2], values[1]];
  return [values[0], values[1], values[2], values[3]];
};

class FakeStyleStore {
  private declarations = new Map<string, string>();

  reset() {
    this.declarations.clear();
  }

  setProperty(name: string, value: string) {
    this.declarations.set(name, value);
  }

  getPropertyValue(name: string) {
    const directValue = this.declarations.get(name);
    if (directValue != null)
      return directValue;

    const boxSideMap: Record<string, [string, number]> = {
      'margin-top': ['margin', 0],
      'margin-right': ['margin', 1],
      'margin-bottom': ['margin', 2],
      'margin-left': ['margin', 3],
      'padding-top': ['padding', 0],
      'padding-right': ['padding', 1],
      'padding-bottom': ['padding', 2],
      'padding-left': ['padding', 3],
      'top': ['inset', 0],
      'right': ['inset', 1],
      'bottom': ['inset', 2],
      'left': ['inset', 3],
      'border-top-width': ['border-width', 0],
      'border-right-width': ['border-width', 1],
      'border-bottom-width': ['border-width', 2],
      'border-left-width': ['border-width', 3],
      'border-top-style': ['border-style', 0],
      'border-right-style': ['border-style', 1],
      'border-bottom-style': ['border-style', 2],
      'border-left-style': ['border-style', 3],
      'border-top-color': ['border-color', 0],
      'border-right-color': ['border-color', 1],
      'border-bottom-color': ['border-color', 2],
      'border-left-color': ['border-color', 3]
    };

    const boxSide = boxSideMap[name];
    if (boxSide) {
      const boxValue = this.declarations.get(boxSide[0]);
      if (boxValue != null)
        return expandBoxValues(boxValue)[boxSide[1]];
    }

    const gap = this.declarations.get('gap');
    if (gap && (name === 'row-gap' || name === 'column-gap')) {
      const [rowGap, columnGap = rowGap] = gap.trim().split(/\s+/, 2);
      return name === 'row-gap' ? rowGap : columnGap;
    }

    const flexFlow = this.declarations.get('flex-flow');
    if (flexFlow && (name === 'flex-direction' || name === 'flex-wrap')) {
      const [flexDirection = '', flexWrap = ''] = flexFlow.trim().split(/\s+/, 2);
      return name === 'flex-direction' ? flexDirection : flexWrap;
    }

    const placeContent = this.declarations.get('place-content');
    if (placeContent && (name === 'align-content' || name === 'justify-content')) {
      const [alignContent = '', justifyContent = alignContent] = placeContent.trim().split(/\s+/, 2);
      return name === 'align-content' ? alignContent : justifyContent;
    }

    return '';
  }

  get cssText() {
    const serialized: [string, string][] = [];
    const consumed = new Set<string>();
    const get = (name: string) => this.declarations.get(name);

    const append = (name: string, value: string, consumedNames: string[] = [name]) => {
      serialized.push([name, value]);
      for (const consumedName of consumedNames)
        consumed.add(consumedName);
    };

    const appendDirect = (name: string) => {
      const value = get(name);
      if (value)
        append(name, value);
    };

    appendDirect('border');
    appendDirect('border-width');
    appendDirect('border-style');
    appendDirect('border-color');
    appendDirect('background');
    appendDirect('font');

    const marginTop = get('margin-top');
    const marginRight = get('margin-right');
    const marginBottom = get('margin-bottom');
    const marginLeft = get('margin-left');
    if (!consumed.has('margin') && marginTop && marginRight && marginBottom && marginLeft)
      append('margin', compressBoxValues(marginTop, marginRight, marginBottom, marginLeft), ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']);

    const paddingTop = get('padding-top');
    const paddingRight = get('padding-right');
    const paddingBottom = get('padding-bottom');
    const paddingLeft = get('padding-left');
    if (!consumed.has('padding') && paddingTop && paddingRight && paddingBottom && paddingLeft)
      append('padding', compressBoxValues(paddingTop, paddingRight, paddingBottom, paddingLeft), ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);

    const top = get('top');
    const right = get('right');
    const bottom = get('bottom');
    const left = get('left');
    if (!consumed.has('inset') && top && right && bottom && left)
      append('inset', compressBoxValues(top, right, bottom, left), ['top', 'right', 'bottom', 'left']);

    const rowGap = get('row-gap');
    const columnGap = get('column-gap');
    if (rowGap && columnGap)
      append('gap', `${rowGap} ${columnGap}`, ['row-gap', 'column-gap']);

    const flexDirection = get('flex-direction');
    const flexWrap = get('flex-wrap');
    if (flexDirection && flexWrap)
      append('flex-flow', `${flexDirection} ${flexWrap}`, ['flex-direction', 'flex-wrap']);

    const alignContent = get('align-content');
    const justifyContent = get('justify-content');
    if (alignContent && justifyContent)
      append('place-content', `${alignContent} ${justifyContent}`, ['align-content', 'justify-content']);

    const borderTop = get('border-top');
    const borderLeft = get('border-left');
    const borderStyle = get('border-style');
    if (borderStyle && (borderTop || borderLeft)) {
      const [topStyle, rightStyle, bottomStyle, leftStyle] = expandBoxValues(borderStyle);
      if (borderTop && topStyle)
        append('border-top', `${borderTop} ${topStyle}`.trim(), ['border-top']);
      if (borderLeft && leftStyle)
        append('border-left', `${borderLeft} ${leftStyle}`.trim(), ['border-left']);
      if (rightStyle)
        append('border-right-style', rightStyle, ['border-style']);
      if (bottomStyle)
        append('border-bottom-style', bottomStyle, ['border-style']);
    }

    for (const [name, value] of this.declarations) {
      if (!consumed.has(name) && !serialized.some(x => x[0] === name))
        append(name, value);
    }

    return serialized.map(([name, value]) => `${name}: ${value};`).join(' ');
  }
}

const createFakeStyle = () => {
  const store = new FakeStyleStore();
  return new Proxy(store as any, {
    get(target, prop) {
      if (typeof prop === 'string' && !(prop in target))
        return target.getPropertyValue(camelToDashCase(prop));

      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && !(prop in target)) {
        target.setProperty(camelToDashCase(prop), String(value));
        return true;
      }

      target[prop] = value;
      return true;
    }
  });
};

class FakeHelperElement {
  style = createFakeStyle();

  setAttribute(name: string, value: string) {
    if (name === 'style' && value === '')
      this.style.reset();
  }
}

let CssCombiner: typeof import('../src/elements/helper/CssCombiner').CssCombiner;
let originalDocument: unknown;
let originalHelperElement: unknown;

beforeAll(async () => {
  originalDocument = (<any>globalThis).document;
  (<any>globalThis).document = {
    createElement: () => new FakeHelperElement()
  };

  ({ CssCombiner } = await import('../src/elements/helper/CssCombiner'));
});

afterAll(() => {
  (<any>globalThis).document = originalDocument;
});

beforeEach(() => {
  originalHelperElement = (<any>CssCombiner)._helperElement;
  (<any>CssCombiner)._helperElement = new FakeHelperElement();
});

afterEach(() => {
  (<any>CssCombiner)._helperElement = originalHelperElement;
});

const combine = (styles: Record<string, string>, globalStyles?: Record<string, string>) =>
  CssCombiner.combine(
    new Map(Object.entries(styles)),
    globalStyles ? new Map(Object.entries(globalStyles)) : undefined
  );

test('combines border and font longhands into shorthand declarations', () => {
  const result = combine({
    'border-top-style': 'solid',
    'border-right-style': 'solid',
    'border-bottom-style': 'solid',
    'border-left-style': 'solid',
    'border-top-color': 'red',
    'border-right-color': 'red',
    'border-bottom-color': 'red',
    'border-left-color': 'red',
    'border-top-width': '1px',
    'border-right-width': '1px',
    'border-bottom-width': '1px',
    'border-left-width': '1px',
    'font-style': 'italic',
    'font-weight': '700',
    'font-size': '16px',
    'line-height': '24px',
    'font-family': '"Fira Code", monospace'
  });

  expect(result.get('border')).toBe('1px solid red');
  expect(result.has('border-top-width')).toBe(false);
  expect(result.has('border-right-width')).toBe(false);
  expect(result.has('border-bottom-width')).toBe(false);
  expect(result.has('border-left-width')).toBe(false);

  const font = result.get('font');
  expect(font).toContain('italic');
  expect(font).toContain('700');
  expect(font).toContain('16px');
  expect(font).toContain('24px');
  expect(font).toContain('Fira Code');
  expect(result.has('font-style')).toBe(false);
  expect(result.has('font-weight')).toBe(false);
  expect(result.has('font-size')).toBe(false);
  expect(result.has('line-height')).toBe(false);
  expect(result.has('font-family')).toBe(false);
});

test('combines additional browser-supported shorthand groups through CSSOM serialization', () => {
  const result = combine({
    'row-gap': '4px',
    'column-gap': '8px',
    'flex-direction': 'column',
    'flex-wrap': 'wrap',
    'align-content': 'center',
    'justify-content': 'space-between'
  });

  expect(result.get('gap')).toBe('4px 8px');
  expect(result.get('flex-flow')).toBe('column wrap');
  expect(result.get('place-content')).toBe('center space-between');

  expect(result.has('row-gap')).toBe(false);
  expect(result.has('column-gap')).toBe(false);
  expect(result.has('flex-direction')).toBe(false);
  expect(result.has('flex-wrap')).toBe(false);
  expect(result.has('align-content')).toBe(false);
  expect(result.has('justify-content')).toBe(false);
});

test('keeps custom properties and removes shorthand declarations that match global styles', () => {
  const result = combine({
    '--brand-color': '#c00',
    'row-gap': '4px',
    'column-gap': '8px'
  }, {
    'gap': '4px 8px'
  });

  expect(result.get('--brand-color')).toBe('#c00');
  expect(result.has('gap')).toBe(false);
});

test('parses cssText declarations with semicolons inside urls', () => {
  const result = (<any>CssCombiner).parseStyleDeclarationList(
    'background: url("data:image/svg+xml;utf8,<svg viewBox=\\"0 0 1 1\\"></svg>") no-repeat center / cover; color: red;'
  );

  expect(result.get('background')).toBe('url("data:image/svg+xml;utf8,<svg viewBox=\\"0 0 1 1\\"></svg>") no-repeat center / cover');
  expect(result.get('color')).toBe('red');
});

test('does not replace declarations with longer browser cssText expansions', () => {
  const result = combine({
    'border-top': '4px',
    'border-left': '2px',
    'border-style': 'solid'
  });

  expect(result.get('border-top')).toBe('4px');
  expect(result.get('border-left')).toBe('2px');
  expect(result.get('border-style')).toBe('solid');
  expect(result.has('border-right-style')).toBe(false);
  expect(result.has('border-bottom-style')).toBe(false);
});