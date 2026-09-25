import { IPoint } from '../../../../interfaces/IPoint.js';
import { ResizeHandle } from '../../../services/resizeService/IElementResizeStrategy.js';

export function getMidpointHandleVisibility(corners: Pick<DOMQuad, 'p1' | 'p2' | 'p3' | 'p4'>, radius: number): Partial<Record<ResizeHandle, boolean>> {
  // Three handle diameters leave a radius of space between adjacent handles.
  const hasRoom = (start: IPoint, end: IPoint) => Math.hypot(end.x - start.x, end.y - start.y) >= 6 * radius;
  return {
    'n-resize': hasRoom(corners.p1, corners.p2),
    'e-resize': hasRoom(corners.p2, corners.p3),
    's-resize': hasRoom(corners.p4, corners.p3),
    'w-resize': hasRoom(corners.p1, corners.p4)
  };
}
