import { afterEach, expect, jest, test } from '@jest/globals';
import { getCanvasPointAtViewportCenter, ZoomHoldRepeater } from '../src/elements/widgets/designerView/ZoomHelper';

afterEach(() => {
  jest.useRealTimers();
});

test('keeps the zoomed-to canvas point at the center of the viewport', () => {
  const viewport = { width: 1000, height: 600 };
  const zoomedToPoint = { x: 850, y: 495 };
  const oldZoom = 6;
  const oldOffset = {
    x: -zoomedToPoint.x + viewport.width / oldZoom / 2,
    y: -zoomedToPoint.y + viewport.height / oldZoom / 2
  };

  const centerPoint = getCanvasPointAtViewportCenter(viewport.width, viewport.height, oldZoom, oldOffset);

  expect(centerPoint.x).toBeCloseTo(zoomedToPoint.x);
  expect(centerPoint.y).toBeCloseTo(zoomedToPoint.y);

  const newZoom = 5.9;
  const newOffset = {
    x: -centerPoint.x + viewport.width / newZoom / 2,
    y: -centerPoint.y + viewport.height / newZoom / 2
  };

  expect(newZoom * (zoomedToPoint.x + newOffset.x)).toBeCloseTo(viewport.width / 2);
  expect(newZoom * (zoomedToPoint.y + newOffset.y)).toBeCloseTo(viewport.height / 2);
});

test('zooms once immediately and starts the finer action after the hold delay', () => {
  jest.useFakeTimers();
  const initialZoom = jest.fn();
  const fineZoom = jest.fn();
  const repeater = new ZoomHoldRepeater(350, 100 / 6);

  repeater.start(initialZoom, fineZoom);
  expect(initialZoom).toHaveBeenCalledTimes(1);
  expect(fineZoom).not.toHaveBeenCalled();

  jest.advanceTimersByTime(349);
  expect(initialZoom).toHaveBeenCalledTimes(1);
  expect(fineZoom).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1);
  expect(initialZoom).toHaveBeenCalledTimes(1);
  expect(fineZoom).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(50.1);
  expect(fineZoom).toHaveBeenCalledTimes(4);

  repeater.stop();
  jest.advanceTimersByTime(500);
  expect(initialZoom).toHaveBeenCalledTimes(1);
  expect(fineZoom).toHaveBeenCalledTimes(4);
});

test('releasing before the hold delay keeps the single zoom step', () => {
  jest.useFakeTimers();
  const zoom = jest.fn();
  const repeater = new ZoomHoldRepeater(350, 100);

  repeater.start(zoom);
  repeater.stop();
  jest.advanceTimersByTime(500);

  expect(zoom).toHaveBeenCalledTimes(1);
});
