import { IPoint } from "../../interfaces/IPoint.js";
import { IDesignerCanvas } from "../widgets/designerView/IDesignerCanvas.js";
import { getParentElementIncludingSlots, instanceOf } from "./ElementHelper.js";

//TODO:
//transform-box

let identityMatrix: number[] = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

export function getElementCombinedTransform(element: HTMLElement): DOMMatrix {
  //https://www.w3.org/TR/css-transforms-2/#ctm
  let s = (element.ownerDocument.defaultView ?? window).getComputedStyle(element);

  let m = new DOMMatrix();
  const origin = s.transformOrigin.split(' ');
  const originX = parseFloat(origin[0]);
  const originY = parseFloat(origin[1]);

  //todo: 3d?
  const mOri = new DOMMatrix().translate(originX, originY);
  const mOriInv = new DOMMatrix().translate(-originX, -originY);

  if (s.translate != 'none' && s.translate) {
    m = m.multiply(new DOMMatrix('translate(' + s.translate.replace(' ', ',') + ')'));
  }
  if (s.rotate != 'none' && s.rotate) {
    m = m.multiply(new DOMMatrix('rotate(' + s.rotate.replace(' ', ',') + ')'));
  }
  if (s.scale != 'none' && s.scale) {
    m = m.multiply(new DOMMatrix('scale(' + s.scale.replace(' ', ',') + ')'));
  }
  if (s.transform != 'none' && s.transform) {
    m = m.multiply(new DOMMatrix(s.transform));
  }
  return mOri.multiply(m.multiply(mOriInv));
}

export function combineTransforms(element: HTMLElement, actualTransforms: string, requestedTransformation: string) {
  if (actualTransforms == null || actualTransforms == '') {
    element.style.transform = requestedTransformation;
    return;
  }

  const actualTransformationMatrix = new DOMMatrix(actualTransforms);
  const requestedTransformationMatrix = new DOMMatrix(requestedTransformation);
  const newTransformationMatrix = requestedTransformationMatrix.multiply(actualTransformationMatrix);
  element.style.transform = newTransformationMatrix.toString();
}

export function transformPointByInverseMatrix(point: DOMPoint, matrix: DOMMatrix) {
  const inverse = matrix.inverse();
  return point.matrixTransform(inverse);
}

export function getRotationMatrix3d(axisOfRotation: 'x' | 'y' | 'z' | 'X' | 'Y' | 'Z', angle: number) {
  const angleInRadians = angle / 180 * Math.PI;
  const sin = Math.sin;
  const cos = Math.cos;
  let rotationMatrix3d = [];

  switch (axisOfRotation.toLowerCase()) {
    case 'x':
      rotationMatrix3d = [
        1, 0, 0, 0,
        0, cos(angleInRadians), -sin(angleInRadians), 0,
        0, sin(angleInRadians), cos(angleInRadians), 0,
        0, 0, 0, 1
      ];
      break;
    case 'y':
      rotationMatrix3d = [
        cos(angleInRadians), 0, sin(angleInRadians), 0,
        0, 1, 0, 0,
        -sin(angleInRadians), 0, cos(angleInRadians), 0,
        0, 0, 0, 1
      ];
      break;
    case 'z':
      rotationMatrix3d = [
        cos(angleInRadians), -sin(angleInRadians), 0, 0,
        sin(angleInRadians), cos(angleInRadians), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ];
      break;
    default:
      rotationMatrix3d = null;
      break;
  }

  return rotationMatrix3d;
}

export function rotateElementByMatrix3d(element: HTMLElement, matrix: number[]) {
  element.style.transform = matrixArrayToCssMatrix(matrix);
}

export function matrixArrayToCssMatrix(matrixArray: number[]) {
  return "matrix3d(" + matrixArray.join(',') + ")";
}

export function cssMatrixToMatrixArray(cssMatrix: string) {
  if (!cssMatrix.includes('matrix')) {
    if (cssMatrix != 'none')
      console.error('cssMatrixToMatrixArray: no css matrix passed');
    return identityMatrix;
  }
  let matrixArray: number[] = cssMatrix.match(/^matrix.*\((.*)\)/)[1].split(',').map(Number);
  return matrixArray;
}

export function getRotationAngleFromMatrix(matrixArray: number[], domMatrix: DOMMatrix) {
  let angle = null;
  const a = domMatrix != null ? domMatrix.a : matrixArray[0];
  const b = domMatrix != null ? domMatrix.b : matrixArray[1];
  angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));

  return angle;
}

export function addVectors(vectorA: [number, number], vectorB: [number, number]): [number, number] {
  return [vectorA[0] + vectorB[0], vectorA[1] + vectorB[1]];
}

const elementMatrixCacheKey = Symbol('windowOffsetsCacheKey');
export function getResultingTransformationBetweenElementAndAllAncestors(element: HTMLElement, ancestor: HTMLElement, excludeAncestor?: boolean, cache: Record<string | symbol, any> = {}) {
  let ch: Map<any, DOMMatrix>;
  if (cache)
    ch = cache[elementMatrixCacheKey] ??= new Map<any, DOMMatrix>();
  else
    ch = new Map<any, DOMMatrix>();

  const res = ch.get(element);
  if (res)
    return res;

  let actualElement: HTMLElement = element;
  let parentElementMatrix: DOMMatrix;
  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix = getElementCombinedTransform((<HTMLElement>actualElement));

  while (actualElement != ancestor && actualElement != null) {
    const offsets = getElementOffsetsInContainer(actualElement);
    const mvMat = new DOMMatrix().translate(offsets.x, offsets.y);
    originalElementAndAllParentsMultipliedMatrix = mvMat.multiply(originalElementAndAllParentsMultipliedMatrix);

    const parentElement = <HTMLElement>getParentElementIncludingSlots(actualElement);
    if (parentElement) {
      parentElementMatrix = getElementCombinedTransform((<HTMLElement>parentElement));
      if (parentElement != ancestor || !excludeAncestor) {
        originalElementAndAllParentsMultipliedMatrix = parentElementMatrix.multiply(originalElementAndAllParentsMultipliedMatrix);
      }
    }

    actualElement = parentElement;
  }

  ch.set(element, originalElementAndAllParentsMultipliedMatrix);
  return originalElementAndAllParentsMultipliedMatrix;
}

export function getElementOffsetsInContainer(element: Element) {
  if (instanceOf(element, HTMLElement)) {
    //@ts-ignore
    return { x: element.offsetLeft, y: element.offsetTop };
  } else {
    //todo: this will nor work correctly with transformed SVGs
    const r1 = element.getBoundingClientRect();
    const r2 = element.parentElement.getBoundingClientRect();
    return { x: r1.x - r2.x, y: r1.y - r2.y }
  }
}

export function getDesignerCanvasNormalizedTransformedPoint(element: HTMLElement, point: IPoint, designerCanvas: IDesignerCanvas, cache: Record<string | symbol, any>): IPoint {
  return getDesignerCanvasNormalizedTransformedCornerDOMPoints(element, { x: -point.x, y: -point.y }, designerCanvas, cache)[0];
}

export function getElementSize(element: HTMLElement) {
  let width = element.offsetWidth;
  let height = element.offsetHeight;
  if (instanceOf(element, SVGElement) && (<any>element).width) {
    width = (<SVGAnimatedLength>(<any>element).width).baseVal.value
    height = (<SVGAnimatedLength>(<any>element).height).baseVal.value
  } else if (instanceOf(element, SVGGraphicsElement)) {
    //@ts-ignore
    let bbox = element.getBBox()
    width = bbox.width;
    height = bbox.height;
  } else if (instanceOf(element, MathMLElement)) {
    let bbox = element.getBoundingClientRect()
    width = bbox.width;
    height = bbox.height;
  }
  return { width, height }
}

export function getDesignerCanvasNormalizedTransformedCornerDOMPoints(element: HTMLElement, untransformedCornerPointsOffset: IPoint | [IPoint, IPoint, IPoint, IPoint] | null, designerCanvas: IDesignerCanvas, cache?: Record<string | symbol, any>): [DOMPoint, DOMPoint, DOMPoint, DOMPoint] {

  let { width, height } = getElementSize(element);
  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix = getResultingTransformationBetweenElementAndAllAncestors(element, <HTMLElement>designerCanvas.canvas, true, cache);
  const canvasOffset = designerCanvas.containerOffset;

  let arr = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: 0, y: height }, { x: width, y: height }];
  const transformedCornerPoints: [DOMPoint, DOMPoint, DOMPoint, DOMPoint] = <any>Array<DOMPoint>(4);

  //@ts-ignore
  let off: [IPoint, IPoint, IPoint, IPoint] = untransformedCornerPointsOffset;
  if (off && !Array.isArray(off)) {
    //@ts-ignore
    off = [{ x: off.x, y: off.y }, { x: -off.x, y: off.y }, { x: off.x, y: -off.y }, { x: -off.x, y: -off.y }];
  }
  for (let i = 0; i < 4; i++) {
    let p = new DOMPoint(arr[i].x, arr[i].y);
    let o = { x: 0, y: 0 };
    if (off)
      o = { x: off[i].x, y: off[i].y };
    p = new DOMPoint(arr[i].x - (o.x / designerCanvas.scaleFactor), arr[i].y - (o.y / designerCanvas.scaleFactor));

    let pTransformed = p.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
    transformedCornerPoints[i] = new DOMPoint(pTransformed.x + canvasOffset.x, pTransformed.y + canvasOffset.y);
  }
  return transformedCornerPoints;
}

export function extractTranslationFromDOMMatrix(matrix: DOMMatrix): DOMPoint {
  //TODO: maybe we also need m43 here??
  return new DOMPoint(matrix.m41, matrix.m42, 0, 0);
}

export function extractRotationAngleFromDOMMatrix(matrix: DOMMatrix): number {
  return getRotationAngleFromMatrix(null, matrix);
}