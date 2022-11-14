import { IDesignerCanvas } from "../widgets/designerView/IDesignerCanvas.js";

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

export function getTranslationMatrix3d(deltaX: number, deltaY: number, deltaZ: number) {
  const translationMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    deltaX, deltaY, deltaZ, 1
  ];
  return translationMatrix;
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

export function getDesignerCanvasNormalizedTransformedOrigin(element: HTMLElement, helperElement: HTMLDivElement, designerCanvas: IDesignerCanvas): DOMPoint {
  let originalElement = element;
  let clone = <HTMLElement>element.cloneNode();

  const canvas = originalElement.closest('#node-projects-designer-canvas-canvas');
  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix = getResultingTransformationBetweenElementAndAllAncestors(originalElement, <HTMLElement>canvas, true)

  clone.style.visibility = 'hidden';
  clone.style.transform = '';
  let appendedClone = helperElement.appendChild(clone);
  clone = null;

  const appendedCloneWithoutTranformRect = designerCanvas.getNormalizedElementCoordinates(appendedClone, true);

  const transformOriginAppendedCloneWithoutTransformRelatedToCanvas: DOMPointReadOnly = DOMPointReadOnly.fromPoint(
    {
      x: appendedCloneWithoutTranformRect.x + parseInt(getComputedStyle(<HTMLElement>originalElement).transformOrigin.split(' ')[0]),
      y: appendedCloneWithoutTranformRect.y + parseInt(getComputedStyle(<HTMLElement>originalElement).transformOrigin.split(' ')[1]),
      z: 0,
      w: 0
    }
  )

  appendedClone.style.transform = originalElementAndAllParentsMultipliedMatrix.toString();
  const appendedCloneWithTranformRect = designerCanvas.getNormalizedElementCoordinates(appendedClone, true);
  const originalElementRect = designerCanvas.getNormalizedElementCoordinates(originalElement, true);
  const appendedCloneToOriginalElementDeltaX = appendedCloneWithTranformRect.x - originalElementRect.x;
  const appendedCloneToOriginalElementDeltaY = appendedCloneWithTranformRect.y - originalElementRect.y;

  const originalElementTransformOriginRelatedToCanvas: DOMPointReadOnly = DOMPointReadOnly.fromPoint(
    {
      x: transformOriginAppendedCloneWithoutTransformRelatedToCanvas.x - appendedCloneToOriginalElementDeltaX,
      y: transformOriginAppendedCloneWithoutTransformRelatedToCanvas.y - appendedCloneToOriginalElementDeltaY,
      z: 0,
      w: 0
    }
  )

  helperElement.removeChild(appendedClone)

  return originalElementTransformOriginRelatedToCanvas;

}

export function getResultingTransformationBetweenElementAndAllAncestors(element: HTMLElement, ancestor: HTMLElement, excludeAncestor?: boolean) {
  let actualElement: HTMLElement = element;
  let actualElementMatrix: DOMMatrix;
  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix;
  while (actualElement != ancestor) {
    actualElementMatrix = new DOMMatrix(getComputedStyle((<HTMLElement>actualElement)).transform);
    if (actualElement == element) {
      originalElementAndAllParentsMultipliedMatrix = actualElementMatrix.multiply(new DOMMatrix(getComputedStyle(actualElement.parentElement).transform));
    } else if (actualElement.parentElement != ancestor || !excludeAncestor) {
      originalElementAndAllParentsMultipliedMatrix = originalElementAndAllParentsMultipliedMatrix.multiply(new DOMMatrix(getComputedStyle(actualElement.parentElement).transform));
    } 
    
    actualElement = actualElement.parentElement;
  }

  return originalElementAndAllParentsMultipliedMatrix;
}

export function getDesignerCanvasNormalizedTransformedCornerDOMPoints(element: HTMLElement, untransformedCornerPointsOffset: number, helperElement: HTMLDivElement, designerCanvas: IDesignerCanvas): DOMPoint[] {
  let originalElement = element;
  let clone = <HTMLElement>originalElement.cloneNode();

  const topleft = 0;
  const topright = 1;
  const bottomleft = 2;
  const bottomright = 3;

  clone.style.visibility = 'hidden';
  clone.style.transform = '';
  let appendedClone = helperElement.appendChild(clone); // this is a direct child of the designer canvas
  clone = null;

  const originalElementTransformOriginRelatedToCanvas: DOMPointReadOnly = getDesignerCanvasNormalizedTransformedOrigin(originalElement, helperElement, designerCanvas);

  const appendedCloneWithoutTranformRect = designerCanvas.getNormalizedElementCoordinates(appendedClone, true);

  const appendedCloneWithoutTranformCornerDOMPoints: DOMPoint[] = [];
  appendedCloneWithoutTranformCornerDOMPoints[topleft] = DOMPoint.fromPoint(
    {
      x: appendedCloneWithoutTranformRect.x - untransformedCornerPointsOffset,
      y: appendedCloneWithoutTranformRect.y - untransformedCornerPointsOffset
    }
  )
  appendedCloneWithoutTranformCornerDOMPoints[topright] = DOMPoint.fromPoint(
    {
      x: appendedCloneWithoutTranformRect.x + appendedCloneWithoutTranformRect.width + untransformedCornerPointsOffset,
      y: appendedCloneWithoutTranformRect.y - untransformedCornerPointsOffset
    }
  )
  appendedCloneWithoutTranformCornerDOMPoints[bottomleft] = DOMPoint.fromPoint(
    {
      x: appendedCloneWithoutTranformRect.x - untransformedCornerPointsOffset,
      y: appendedCloneWithoutTranformRect.y + appendedCloneWithoutTranformRect.height + untransformedCornerPointsOffset
    }
  )
  appendedCloneWithoutTranformCornerDOMPoints[bottomright] = DOMPoint.fromPoint(
    {
      x: appendedCloneWithoutTranformRect.x + appendedCloneWithoutTranformRect.width + untransformedCornerPointsOffset,
      y: appendedCloneWithoutTranformRect.y + appendedCloneWithoutTranformRect.height + untransformedCornerPointsOffset
    }
  )

  const transformOriginAppendedCloneWithoutTransformRelatedToCanvas: DOMPointReadOnly = DOMPointReadOnly.fromPoint(
    {
      x: appendedCloneWithoutTranformRect.x + parseInt(getComputedStyle(<HTMLElement>originalElement).transformOrigin.split(' ')[0]),
      y: appendedCloneWithoutTranformRect.y + parseInt(getComputedStyle(<HTMLElement>originalElement).transformOrigin.split(' ')[1]),
      z: 0,
      w: 0
    }
  )

  let top0 = new DOMPoint(-(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[topleft].x), -(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[topleft].y));
  let top1 = new DOMPoint(-(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[topright].x), -(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[topright].y));
  let top2 = new DOMPoint(-(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[bottomleft].x), -(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[bottomleft].y));
  let top3 = new DOMPoint(-(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[bottomright].x), -(transformOriginAppendedCloneWithoutTransformRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[bottomright].y));

  let originalElementAndAllParentsMultipliedMatrix: DOMMatrix = getResultingTransformationBetweenElementAndAllAncestors(originalElement, <HTMLElement>designerCanvas.canvas, true)

  let top0Transformed = top0.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top1Transformed = top1.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top2Transformed = top2.matrixTransform(originalElementAndAllParentsMultipliedMatrix);
  let top3Transformed = top3.matrixTransform(originalElementAndAllParentsMultipliedMatrix);

  let transformedCornerPoints: DOMPoint[] = [];
  transformedCornerPoints[0] = new DOMPoint(originalElementTransformOriginRelatedToCanvas.x + top0Transformed.x, originalElementTransformOriginRelatedToCanvas.y + top0Transformed.y);
  transformedCornerPoints[1] = new DOMPoint(originalElementTransformOriginRelatedToCanvas.x + top1Transformed.x, originalElementTransformOriginRelatedToCanvas.y + top1Transformed.y);
  transformedCornerPoints[2] = new DOMPoint(originalElementTransformOriginRelatedToCanvas.x + top2Transformed.x, originalElementTransformOriginRelatedToCanvas.y + top2Transformed.y);
  transformedCornerPoints[3] = new DOMPoint(originalElementTransformOriginRelatedToCanvas.x + top3Transformed.x, originalElementTransformOriginRelatedToCanvas.y + top3Transformed.y);

  helperElement.replaceChildren();

  return transformedCornerPoints;
}