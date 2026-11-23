/** @jest-environment jsdom */
import { afterEach, expect, test } from '@jest/globals';
import { beginPlacementTransform, getPlacementTransform, restorePlacementTransform } from '../src/elements/helper/TransformHelper';

afterEach(() => { document.body.replaceChildren(); });

test('placement retains runtime inline rotation through repeated previews without persisting it', () => {
  const element = document.createElement('div');
  element.style.setProperty('transform', 'translate(12px, 9px) rotate(270deg)', 'important');
  document.body.append(element);
  const baseline = beginPlacementTransform(element);
  element.style.transform = 'matrix(0, -1, 1, 0, 42, 29)';
  expect(getPlacementTransform(element)).toEqual(baseline);
  element.style.transform = 'matrix(0, -1, 1, 0, 62, 49)';
  expect(restorePlacementTransform(element)).toEqual(baseline);
  expect(element.style.transform).toBe('translate(12px, 9px) rotate(270deg)');
  expect(element.style.getPropertyPriority('transform')).toBe('important');
  element.style.transform = 'rotate(90deg)';
  expect(beginPlacementTransform(element).computed).toBe('rotate(90deg)');
  restorePlacementTransform(element);
});

test('placement preserves stylesheet rotation while restoring an absent inline transform', () => {
  const style = document.createElement('style');
  style.textContent = '.turned { transform: translate(8px, 6px) rotate(35deg) scale(0.8); }';
  const element = document.createElement('div');
  element.className = 'turned';
  document.body.append(style, element);
  const baseline = beginPlacementTransform(element);
  expect(baseline.inline).toBe('');
  expect(baseline.computed).toBe('translate(8px, 6px) rotate(35deg) scale(0.8)');
  element.style.transform = 'matrix(1, 0, 0, 1, 30, 20)';
  expect(getPlacementTransform(element)).toEqual(baseline);
  restorePlacementTransform(element);
  expect(element.style.transform).toBe('');
  expect(getComputedStyle(element).transform).toBe(baseline.computed);
});
