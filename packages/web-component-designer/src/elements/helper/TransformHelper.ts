import { IPoint } from "../../interfaces/IPoint.js";
import { IDesignerCanvas } from "../widgets/designerView/IDesignerCanvas.js";
import { getParentElementIncludingSlots } from "./ElementHelper.js";

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

  //const res = ch.get(element);
  //if (res)
  //  return res;

  let actualElement: HTMLElement = element;
  //let actualElementMatrix: DOMMatrix;
  let parentElementMatrix: DOMMatrix;
  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix = getElementCombinedTransform((<HTMLElement>actualElement));

  while (actualElement != ancestor && actualElement != null) {
    const mvMat = new DOMMatrix().translate(actualElement.offsetLeft, actualElement.offsetTop);
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

export function getDesignerCanvasNormalizedTransformedPoint(element: HTMLElement, point: IPoint, designerCanvas: IDesignerCanvas, cache: Record<string | symbol, any>): IPoint {
  return getDesignerCanvasNormalizedTransformedCornerDOMPoints(element, { x: -point.x, y: -point.y }, designerCanvas, cache)[0];
}

export function getElementSize(element: HTMLElement) {
  let width = element.offsetWidth;
  let height = element.offsetHeight;
  if (element instanceof (element.ownerDocument.defaultView ?? window).SVGElement && (<any>element).width) {
    width = (<SVGAnimatedLength>(<any>element).width).baseVal.value
    height = (<SVGAnimatedLength>(<any>element).height).baseVal.value
  } else if (element instanceof (element.ownerDocument.defaultView ?? window).SVGGraphicsElement) {
    let bbox = element.getBBox()
    width = bbox.width;
    height = bbox.height;
  } else if (element instanceof (element.ownerDocument.defaultView ?? window).MathMLElement) {
    let bbox = element.getBoundingClientRect()
    width = bbox.width;
    height = bbox.height;
  }
  return { width, height }
}

//const nullOffsetArray = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];

export function getDesignerCanvasNormalizedTransformedCornerDOMPoints(element: HTMLElement, untransformedCornerPointsOffset: IPoint | [IPoint, IPoint, IPoint, IPoint] | null, designerCanvas: IDesignerCanvas, cache?: Record<string | symbol, any>): [DOMPoint, DOMPoint, DOMPoint, DOMPoint] {
  const designerCanvasNormalizedTransformOrigin = { x: 0, y: 0 };

  let { width, height } = getElementSize(element);
  let top0 = new DOMPoint(0, 0);
  let top1 = new DOMPoint(width, 0);
  let top2 = new DOMPoint(0, height);
  let top3 = new DOMPoint(width, height);

  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix = getResultingTransformationBetweenElementAndAllAncestors(element, <HTMLElement>designerCanvas.canvas, true, cache);

  let top0Transformed = top0.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top1Transformed = top1.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top2Transformed = top2.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top3Transformed = top3.matrixTransform(originalElementAndAllParentsMultipliedMatrix);

  const transformedCornerPoints: [DOMPoint, DOMPoint, DOMPoint, DOMPoint] = <any>[];
  const offset = designerCanvas.containerOffset;
  transformedCornerPoints[0] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top0Transformed.x + offset.x, designerCanvasNormalizedTransformOrigin.y + top0Transformed.y + offset.y);
  transformedCornerPoints[1] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top1Transformed.x + offset.x, designerCanvasNormalizedTransformOrigin.y + top1Transformed.y + offset.y);
  transformedCornerPoints[2] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top2Transformed.x + offset.x, designerCanvasNormalizedTransformOrigin.y + top2Transformed.y + offset.y);
  transformedCornerPoints[3] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top3Transformed.x + offset.x, designerCanvasNormalizedTransformOrigin.y + top3Transformed.y + offset.y);

  return transformedCornerPoints;
}

export function extractTranslationFromDOMMatrix(matrix: DOMMatrix): DOMPoint {
  //TODO: maybe we also need m43 here??
  return new DOMPoint(matrix.m41, matrix.m42, 0, 0);
}

export function extractRotationAngleFromDOMMatrix(matrix: DOMMatrix): number {
  return getRotationAngleFromMatrix(null, matrix);
}