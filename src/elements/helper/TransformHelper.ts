import { IPoint } from "../../interfaces/IPoint.js";
import { IDesignerCanvas } from "../widgets/designerView/IDesignerCanvas.js";
import { getElementsWindowOffsetWithoutSelfAndParentTransformations, getParentElementIncludingSlots } from "./ElementHelper.js";

let identityMatrix: number[] = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

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

export function getDomMatrix(element: HTMLElement) {
  return new DOMMatrix(window.getComputedStyle(element).transform);
}

export function convertCoordinates(point: DOMPoint, matrix: DOMMatrix) {
  return point.matrixTransform(matrix.inverse());
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
  const top0: DOMPointReadOnly = new DOMPointReadOnly(
    -parseInt(getComputedStyle(<HTMLElement>element).transformOrigin.split(' ')[0]),
    -parseInt(getComputedStyle(<HTMLElement>element).transformOrigin.split(' ')[1]),
    0,
    0
  )

  const p0Offsets = getElementsWindowOffsetWithoutSelfAndParentTransformations(element);

  const transformOriginAbsolutRelatedToWindowWithoutAnyTransformation = new DOMPoint(p0Offsets.offsetLeft - top0.x, p0Offsets.offsetTop - top0.y);
  const designerCanvasNormalizedTransformedOrigin = new DOMPoint(transformOriginAbsolutRelatedToWindowWithoutAnyTransformation.x - designerCanvas.containerBoundingRect.x, transformOriginAbsolutRelatedToWindowWithoutAnyTransformation.y - designerCanvas.containerBoundingRect.y);

  return designerCanvasNormalizedTransformedOrigin;
}

export function getResultingTransformationBetweenElementAndAllAncestors(element: HTMLElement, ancestor: HTMLElement, excludeAncestor?: boolean) {
  let actualElement: HTMLElement = element;
  let actualElementMatrix: DOMMatrix;
  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix;
  while (actualElement != ancestor) {
    const newElement = <HTMLElement>getParentElementIncludingSlots(actualElement);
    actualElementMatrix = new DOMMatrix(getComputedStyle((<HTMLElement>actualElement)).transform);
    if (actualElement == element) {
      originalElementAndAllParentsMultipliedMatrix = actualElementMatrix.multiply(new DOMMatrix(getComputedStyle(newElement).transform));
    } else if (newElement != ancestor || !excludeAncestor) {
      originalElementAndAllParentsMultipliedMatrix = originalElementAndAllParentsMultipliedMatrix.multiply(new DOMMatrix(getComputedStyle(newElement).transform));
    }

    actualElement = newElement;
  }

  return originalElementAndAllParentsMultipliedMatrix;
}

export function getByParentsTransformedPointRelatedToCanvas(element: HTMLElement, point: DOMPoint, designerCanvas: IDesignerCanvas) {
  const canvas = element.closest('#node-projects-designer-canvas-canvas');
  let actualElement: HTMLElement = element;
  let parentElementTransformOriginToPointVectorTransformed: DOMPointReadOnly;
  let byParentTransformedPointRelatedToCanvas: IPoint = { x: 0, y: 0 };
  while (actualElement != canvas) {
    const parentElement = <HTMLElement>getParentElementIncludingSlots(actualElement);
    const parentElementTransformOrigin: DOMPoint = new DOMPoint(
      getElementsWindowOffsetWithoutSelfAndParentTransformations(parentElement).offsetLeft - designerCanvas.outerRect.x + parseInt(getComputedStyle(<HTMLElement>parentElement).transformOrigin.split(' ')[0]),
      getElementsWindowOffsetWithoutSelfAndParentTransformations(parentElement).offsetTop - designerCanvas.outerRect.y + parseInt(getComputedStyle(<HTMLElement>parentElement).transformOrigin.split(' ')[1]),
    )
    parentElementTransformOrigin.x -=  extractTranslationFromDOMMatrix(new DOMMatrix(element.style.transform)).x;
    parentElementTransformOrigin.y -=  extractTranslationFromDOMMatrix(new DOMMatrix(element.style.transform)).y;
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

export function getDesignerCanvasNormalizedTransformedCornerDOMPoints(element: HTMLElement, untransformedCornerPointsOffset: number, designerCanvas: IDesignerCanvas): [DOMPoint, DOMPoint, DOMPoint, DOMPoint] {
  const topleft = 0;
  const topright = 1;
  const bottomleft = 2;
  const bottomright = 3;

  const p0Offsets = getElementsWindowOffsetWithoutSelfAndParentTransformations(element);
  const p0OffsetsRelatedToCanvas = DOMPoint.fromPoint(
    {
      x: p0Offsets.offsetLeft - designerCanvas.containerBoundingRect.left,
      y: p0Offsets.offsetTop - designerCanvas.containerBoundingRect.top
    }
  )

  let width = parseInt(getComputedStyle(element).width.replace('px', ''));
  let height = parseInt(getComputedStyle(element).height.replace('px', ''));

  if (getComputedStyle(element).boxSizing == 'content-box') {
    width += parseInt(getComputedStyle(element).paddingLeft.replace('px', ''))
      + parseInt(getComputedStyle(element).marginLeft.replace('px', ''))
      + parseInt(getComputedStyle(element).borderLeft.replace('px', ''))
      + parseInt(getComputedStyle(element).paddingRight.replace('px', ''))
      + parseInt(getComputedStyle(element).marginRight.replace('px', ''))
      + parseInt(getComputedStyle(element).borderRight.replace('px', ''));

    height += parseInt(getComputedStyle(element).paddingTop.replace('px', ''))
      + parseInt(getComputedStyle(element).marginTop.replace('px', ''))
      + parseInt(getComputedStyle(element).borderTop.replace('px', ''))
      + parseInt(getComputedStyle(element).paddingBottom.replace('px', ''))
      + parseInt(getComputedStyle(element).marginBottom.replace('px', ''))
      + parseInt(getComputedStyle(element).borderBottom.replace('px', ''));
  }

  const elementWithoutTransformCornerDOMPoints: DOMPoint[] = [];
  elementWithoutTransformCornerDOMPoints[topleft] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x - untransformedCornerPointsOffset,
      y: p0OffsetsRelatedToCanvas.y - untransformedCornerPointsOffset
    }
  )
  elementWithoutTransformCornerDOMPoints[topright] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x + width + untransformedCornerPointsOffset,
      y: p0OffsetsRelatedToCanvas.y - untransformedCornerPointsOffset
    }
  )
  elementWithoutTransformCornerDOMPoints[bottomleft] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x - untransformedCornerPointsOffset,
      y: p0OffsetsRelatedToCanvas.y + height + untransformedCornerPointsOffset
    }
  )
  elementWithoutTransformCornerDOMPoints[bottomright] = DOMPoint.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x + width + untransformedCornerPointsOffset,
      y: p0OffsetsRelatedToCanvas.y + height + untransformedCornerPointsOffset
    }
  )

  const transformOriginWithoutTransformRelatedToCanvas: DOMPointReadOnly = DOMPointReadOnly.fromPoint(
    {
      x: p0OffsetsRelatedToCanvas.x + parseInt(getComputedStyle(<HTMLElement>element).transformOrigin.split(' ')[0]),
      y: p0OffsetsRelatedToCanvas.y + parseInt(getComputedStyle(<HTMLElement>element).transformOrigin.split(' ')[1]),
      z: 0,
      w: 0
    }
  )

  const designerCanvasNormalizedTransformOrigin = getByParentsTransformedPointRelatedToCanvas(element, new DOMPoint(getElementsWindowOffsetWithoutSelfAndParentTransformations(element).offsetLeft - designerCanvas.outerRect.left + parseInt(getComputedStyle(<HTMLElement>element).transformOrigin.split(' ')[0]), getElementsWindowOffsetWithoutSelfAndParentTransformations(element).offsetTop - designerCanvas.outerRect.top + parseInt(getComputedStyle(<HTMLElement>element).transformOrigin.split(' ')[1])), designerCanvas);

  let top0 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[topleft].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[topleft].y));
  let top1 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[topright].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[topright].y));
  let top2 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[bottomleft].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[bottomleft].y));
  let top3 = new DOMPoint(-(transformOriginWithoutTransformRelatedToCanvas.x - elementWithoutTransformCornerDOMPoints[bottomright].x), -(transformOriginWithoutTransformRelatedToCanvas.y - elementWithoutTransformCornerDOMPoints[bottomright].y));

  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix = getResultingTransformationBetweenElementAndAllAncestors(element, <HTMLElement>designerCanvas.canvas, true)

  let top0Transformed = top0.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top1Transformed = top1.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top2Transformed = top2.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top3Transformed = top3.matrixTransform(originalElementAndAllParentsMultipliedMatrix);

  let transformedCornerPoints: [DOMPoint, DOMPoint, DOMPoint, DOMPoint] = <any>[];
  transformedCornerPoints[0] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top0Transformed.x, designerCanvasNormalizedTransformOrigin.y + top0Transformed.y);
  transformedCornerPoints[1] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top1Transformed.x, designerCanvasNormalizedTransformOrigin.y + top1Transformed.y);
  transformedCornerPoints[2] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top2Transformed.x, designerCanvasNormalizedTransformOrigin.y + top2Transformed.y);
  transformedCornerPoints[3] = new DOMPoint(designerCanvasNormalizedTransformOrigin.x + top3Transformed.x, designerCanvasNormalizedTransformOrigin.y + top3Transformed.y);

  return transformedCornerPoints;
}

export function extractTranslationFromDOMMatrix(matrix: DOMMatrix): DOMPoint {
  return new DOMPoint(matrix.m41, matrix.m42, 0, 0);
}

export function extractRotationAngleFromDOMMatrix(matrix: DOMMatrix): number {
  return getRotationAngleFromMatrix(null, matrix);
}

export function normalizeToAbsolutePosition(element: HTMLElement, normalizeProperty: "left" | "top") {
  switch (normalizeProperty) {
    case "left":
      let left = getComputedStyle(element).left;
      (<HTMLElement>element).style.removeProperty('right');
      (<HTMLElement>element).style.left = left;
      return left;
    case "top":
      let top = getComputedStyle(element).top;
      (<HTMLElement>element).style.removeProperty('bottom');
      (<HTMLElement>element).style.top = top;
      return top;
  }
  return null;

}