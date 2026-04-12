import { expect, test } from '@jest/globals';
import { createPasteFormatSnapshot, createPasteFormatSnapshotFromEntries, getPasteFormatEntries } from '../src/elements/services/copyPasteService/PasteFormatSnapshot';

test('collects border, background, and text properties and skips unrelated styles', () => {
  const values: Record<string, string> = {
    'background-color': ' rgb(1, 2, 3) ',
    'border-top-color': ' red ',
    'border-top-style': ' solid ',
    'font-family': ' Fira Code ',
    'line-height': ' 24px ',
    'color': ' white ',
    'display': ' grid '
  };

  const fakeStyle = {
    length: 7,
    0: 'background-color',
    1: 'border-top-color',
    2: 'border-top-style',
    3: 'font-family',
    4: 'line-height',
    5: 'color',
    6: 'display',
    getPropertyValue(name: string) {
      return values[name] ?? '';
    }
  } as Pick<CSSStyleDeclaration, 'getPropertyValue' | 'length'> & ArrayLike<string>;

  const snapshot = createPasteFormatSnapshot(fakeStyle);

  expect(snapshot.background).toEqual([{ name: 'background-color', value: 'rgb(1, 2, 3)' }]);
  expect(snapshot.border).toEqual([
    { name: 'border-top-color', value: 'red' },
    { name: 'border-top-style', value: 'solid' }
  ]);
  expect(snapshot.text).toEqual([
    { name: 'font-family', value: 'Fira Code' },
    { name: 'line-height', value: '24px' },
    { name: 'color', value: 'white' }
  ]);
  expect(getPasteFormatEntries(snapshot, 'all')).toEqual([
    { name: 'border-top-color', value: 'red' },
    { name: 'border-top-style', value: 'solid' },
    { name: 'background-color', value: 'rgb(1, 2, 3)' },
    { name: 'font-family', value: 'Fira Code' },
    { name: 'line-height', value: '24px' },
    { name: 'color', value: 'white' }
  ]);
});

test('keeps duplicate properties out of the all group', () => {
  const values: Record<string, string> = {
    'background-image': 'none',
    'background-color': 'transparent',
    'background-color-duplicate': ''
  };

  const fakeStyle = {
    length: 4,
    0: 'background-image',
    1: 'background-color',
    2: 'background-image',
    3: 'background-color-duplicate',
    getPropertyValue(name: string) {
      return values[name] ?? '';
    }
  } as Pick<CSSStyleDeclaration, 'getPropertyValue' | 'length'> & ArrayLike<string>;

  const snapshot = createPasteFormatSnapshot(fakeStyle);

  expect(snapshot.background).toEqual([
    { name: 'background-image', value: 'none' },
    { name: 'background-color', value: 'transparent' }
  ]);
  expect(snapshot.all).toEqual(snapshot.background);
});

test('creates a snapshot from design item style entries', () => {
  const snapshot = createPasteFormatSnapshotFromEntries([
    ['border-top-color', ' red '],
    ['background-color', ' rgb(1, 2, 3) '],
    ['font-family', ' Fira Code '],
    ['color', ' white ']
  ]);

  expect(snapshot?.border).toEqual([{ name: 'border-top-color', value: 'red' }]);
  expect(snapshot?.background).toEqual([{ name: 'background-color', value: 'rgb(1, 2, 3)' }]);
  expect(snapshot?.text).toEqual([
    { name: 'font-family', value: 'Fira Code' },
    { name: 'color', value: 'white' }
  ]);
});