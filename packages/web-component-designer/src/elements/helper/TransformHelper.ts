import { IPoint } from "../../interfaces/IPoint.js";
import { IDesignerCanvas } from "../widgets/designerView/IDesignerCanvas.js";
import { getElementsWindowOffsetWithoutSelfAndParentTransformations, getParentElementIncludingSlots } from "./ElementHelper.js";

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
  return m;
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

export function getDesignerCanvasNormalizedTransformedOriginWithoutParentTransformation(element: HTMLElement, designerCanvas: IDesignerCanvas): DOMPoint {
  const toSplit = getComputedStyle(<HTMLElement>element).transformOrigin.split(' ');
  const tfX = parseFloat(toSplit[0]);
  const tfY = parseFloat(toSplit[1]);
  const top0: DOMPointReadOnly = new DOMPointReadOnly(
    -tfX,
    -tfY,
    0,
    0
  )

  const p0Offsets = getElementsWindowOffsetWithoutSelfAndParentTransformations(element, designerCanvas.zoomFactor);

  const transformOriginAbsolutRelatedToWindowWithoutAnyTransformation = new DOMPoint(p0Offsets.offsetLeft - top0.x, p0Offsets.offsetTop - top0.y);
  const designerCanvasNormalizedTransformedOrigin = new DOMPoint(transformOriginAbsolutRelatedToWindowWithoutAnyTransformation.x - designerCanvas.containerBoundingRect.x, transformOriginAbsolutRelatedToWindowWithoutAnyTransformation.y - designerCanvas.containerBoundingRect.y);

  return designerCanvasNormalizedTransformedOrigin;
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
  let actualElementMatrix: DOMMatrix;
  let newElementMatrix: DOMMatrix;
  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix;
  while (actualElement != ancestor && actualElement != null) {
    const newElement = <HTMLElement>getParentElementIncludingSlots(actualElement);
    if (newElement) {
      actualElementMatrix = getElementCombinedTransform((<HTMLElement>actualElement));
      newElementMatrix = getElementCombinedTransform((<HTMLElement>newElement));
      actualElementMatrix.m43 = 0;
      newElementMatrix.m41 = newElementMatrix.m42 = newElementMatrix.m43 = 0;
      if (actualElement == element) {
        originalElementAndAllParentsMultipliedMatrix = newElementMatrix.multiply(actualElementMatrix);
      } else if (newElement != ancestor || !excludeAncestor) {
        originalElementAndAllParentsMultipliedMatrix = newElementMatrix.multiply(originalElementAndAllParentsMultipliedMatrix);
      }
    }

    actualElement = newElement;
  }

  ch.set(element, originalElementAndAllParentsMultipliedMatrix);
  return originalElementAndAllParentsMultipliedMatrix;
}

export function getByParentsTransformedPointRelatedToCanvas(element: HTMLElement, point: DOMPoint, designerCanvas: IDesignerCanvas, cache?: Record<string | symbol, any>) {
  const canvas = designerCanvas.rootDesignItem.node;
  let actualElement: HTMLElement = element;
  let parentElementTransformOriginToPointVectorTransformed: DOMPointReadOnly;
  let byParentTransformedPointRelatedToCanvas: IPoint = { x: 0, y: 0 };
  while (actualElement != canvas) {
    const parentElement = <HTMLElement>getParentElementIncludingSlots(actualElement);
    if (!parentElement)
      break;
    const elementWindowOffset = getElementsWindowOffsetWithoutSelfAndParentTransformations(parentElement, designerCanvas.zoomFactor, cache);

    const toSplit = getComputedStyle(<HTMLElement>parentElement).transformOrigin.split(' ');
    const tfX = parseFloat(toSplit[0]);
    const tfY = parseFloat(toSplit[1]);
    const parentElementTransformOrigin: DOMPoint = new DOMPoint(
      elementWindowOffset.offsetLeft - designerCanvas.outerRect.x + tfX,
      elementWindowOffset.offsetTop - designerCanvas.outerRect.y + tfY,
    )
    if (actualElement == element) {
      const transf = (element.ownerDocument.defaultView ?? window).getComputedStyle(element).transform;
      const mtx = extractTranslationFromDOMMatrix(new DOMMatrix(transf));
      parentElementTransformOrigin.x -= mtx.x;
      parentElementTransformOrigin.y -= mtx.y;
    }

    const parentElementTransformOriginToPointVector: DOMPointReadOnly = new DOMPointReadOnly(
      -parentElementTransformOrigin.x + (element == actualElement ? point.x : byParentTransformedPointRelatedToCanvas.x),
      -parentElementTransformOrigin.y + (element == actualElement ? point.y : byParentTransformedPointRelatedToCanvas.y)
    )

    parentElementTransformOriginToPointVectorTransformed = parentElementTransformOriginToPointVector.matrixTransform(new DOMMatrix(getComputedStyle((<HTMLElement>parentElement)).transform));
    byParentTransformedPointRelatedToCanvas = new DOMPoint(parentElementTransformOrigin.x + parentElementTransformOriginToPointVectorTransformed.x, parentElementTransformOrigin.y + parentElementTransformOriginToPointVectorTransformed.y);
    actualElement = parentElement;
  }

  return byParentTransformedPointRelatedToCanvas;
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

const nullOffsetArray = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];

export function getDesignerCanvasNormalizedTransformedCornerDOMPoints(element: HTMLElement, untransformedCornerPointsOffset: IPoint | [IPoint, IPoint, IPoint, IPoint] | null, designerCanvas: IDesignerCanvas, cache?: Record<string | symbol, any>): [DOMPoint, DOMPoint, DOMPoint, DOMPoint] {
  const topleft = 0;
  const topright = 1;
  const bottomleft = 2;
  const bottomright = 3;

  //offset points for calculation
  let intUntransformedCornerPointsOffset = nullOffsetArray;
  if (untransformedCornerPointsOffset != null) {
    if (Array.isArray(untransformedCornerPointsOffset)) {
      const v0 = { x: untransformedCornerPointsOffset[0].x / designerCanvas.scaleFactor, y: untransformedCornerPointsOffset[0].y / designerCanvas.scaleFactor };
      const v1 = { x: untransformedCornerPointsOffset[1].x / designerCanvas.scaleFactor, y: untransformedCornerPointsOffset[1].y / designerCanvas.scaleFactor };
      const v2 = { x: untransformedCornerPointsOffset[2].x / designerCanvas.scaleFactor, y: untransformedCornerPointsOffset[2].y / designerCanvas.scaleFactor };
      const v3 = { x: untransformedCornerPointsOffset[3].x / designerCanvas.scaleFactor, y: untransformedCornerPointsOffset[3].y / designerCanvas.scaleFactor };
      intUntransformedCornerPointsOffset = [v0, v1, v2, v3];
    } else {
      const v = { x: untransformedCornerPointsOffset.x / designerCanvas.scaleFactor, y: untransformedCornerPointsOffset.y / designerCanvas.scaleFactor };
      intUntransformedCornerPointsOffset = [v, v, v, v];
    }
  }

  const p0Offsets = getElementsWindowOffsetWithoutSelfAndParentTransformations(element, designerCanvas.zoomFactor, cache);
  const p0OffsetsRelatedToCanvas = DOMPoint.fromPoint(
    {
      x: p0Offsets.offsetLeft - designerCanvas.containerBoundingRect.left,
      y: p0Offsets.offsetTop - designerCanvas.containerBoundingRect.top
    }
  )

  let { width, height } = getElementSize(element);

  const elementWithoutTransformCornerDOMPoints: DOMPoint[] = [];
  elementWithoutTransformCornerDOMPoints[topleft] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x - intUntransformedCornerPointsOffset[0].x,
      y: p0OffsetsRelatedToCanvas.y - intUntransformedCornerPointsOffset[0].y
    }
  )
  elementWithoutTransformCornerDOMPoints[topright] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x + width + intUntransformedCornerPointsOffset[1].x,
      y: p0OffsetsRelatedToCanvas.y - intUntransformedCornerPointsOffset[1].y
    }
  )
  elementWithoutTransformCornerDOMPoints[bottomleft] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x - intUntransformedCornerPointsOffset[2].x,
      y: p0OffsetsRelatedToCanvas.y + height + intUntransformedCornerPointsOffset[2].y
    }
  )
  elementWithoutTransformCornerDOMPoints[bottomright] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x + width + intUntransformedCornerPointsOffset[3].x,
      y: p0OffsetsRelatedToCanvas.y + height + intUntransformedCornerPointsOffset[3].y
    }
  )

  const toSplit = getComputedStyle(<HTMLElement>element).transformOrigin.split(' ');
  const tfX = parseFloat(toSplit[0]);
  const tfY = parseFloat(toSplit[1]);

  const transformOriginWithoutTransformRelatedToCanvas: DOMPointReadOnly = DOMPointReadOnly.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x + tfX,
      y: p0OffsetsRelatedToCanvas.y + tfY,
      z: 0,
      w: 0
    }
  )

  const designerCanvasNormalizedTransformOrigin = getByParentsTransformedPointRelatedToCanvas(element, new DOMPoint(p0Offsets.offsetLeft - designerCanvas.outerRect.left + tfX, p0Offsets.offsetTop - designerCanvas.outerRect.top + tfY), designerCanvas, cache);

  let top0 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[topleft].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[topleft].y));
  let top1 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[topright].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[topright].y));
  let top2 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[bottomleft].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[bottomleft].y));
  let top3 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[bottomright].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[bottomright].y));

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