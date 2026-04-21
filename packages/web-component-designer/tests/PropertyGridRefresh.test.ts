import { expect, test } from '@jest/globals';
import { didAttributePresenceChange, didCustomStyleDeclarationSetChange, didStyleDeclarationSetChange } from '../src/elements/services/propertiesService/PropertyMutationHandling';

test('does not recreate when an existing attribute value changes', () => {
  const mutation = {
    type: 'attributes',
    attributeName: 'style',
    oldValue: 'width: 10px;',
    target: {
      getAttribute: () => 'width: 20px;'
    }
  } as const;

  expect(didAttributePresenceChange(mutation)).toBe(false);
  expect(didStyleDeclarationSetChange(mutation)).toBe(false);
});

test('recreates when an attribute is added', () => {
  const mutation = {
    type: 'attributes',
    attributeName: 'style',
    oldValue: null,
    target: {
      getAttribute: () => 'width: 20px;'
    }
  } as const;

  expect(didAttributePresenceChange(mutation)).toBe(true);
  expect(didStyleDeclarationSetChange(mutation)).toBe(true);
});

test('recreates when an attribute is removed', () => {
  const mutation = {
    type: 'attributes',
    attributeName: 'title',
    oldValue: 'hello',
    target: {
      getAttribute: () => null
    }
  } as const;

  expect(didAttributePresenceChange(mutation)).toBe(true);
  expect(didStyleDeclarationSetChange(mutation)).toBe(false);
});

test('recreates styles when inline declaration names change', () => {
  const mutation = {
    type: 'attributes',
    attributeName: 'style',
    oldValue: 'width: 10px; color: red;',
    target: {
      getAttribute: () => 'width: 20px; height: 30px; color: red;'
    }
  } as const;

  expect(didStyleDeclarationSetChange(mutation)).toBe(true);
});

test('does not recreate styles when only inline declaration values change', () => {
  const mutation = {
    type: 'attributes',
    attributeName: 'style',
    oldValue: 'width: 10px; color: red;',
    target: {
      getAttribute: () => 'width: 20px; color: blue;'
    }
  } as const;

  expect(didStyleDeclarationSetChange(mutation)).toBe(false);
});

test('custom properties only recreate for custom declaration changes', () => {
  const mutation = {
    type: 'attributes',
    attributeName: 'style',
    oldValue: '--brand: red; width: 10px;',
    target: {
      getAttribute: () => '--brand: blue; --accent: orange; width: 20px;'
    }
  } as const;

  expect(didCustomStyleDeclarationSetChange(mutation)).toBe(true);
});