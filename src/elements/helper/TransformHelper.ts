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

// export function applyMatrixToPoint(cssMatrix: string, point: {x: number, y: number}) : IPoint3D {
//   const transformationMatrix = new DOMMatrix(cssMatrix);
//   return {
//     x: transformationMatrix.m11 * point.x + transformationMatrix.m21 * point.y,
//     y: transformationMatrix.m12 * point.x + transformationMatrix.m22 * point.y,
//     z: 0
//   }
// }

// export function getTransformedCornerPoints(originalElement: HTMLElement, clonedElement: HTMLElement, helperElement: HTMLDivElement, designerCanvas: IDesignerCanvas, untransformedCornerPointsOffset: number) {
//   const originalRect = designerCanvas.getNormalizedElementCoordinates(originalElement.parentElement);
//   clonedElement.style.visibility = 'hidden';
//   const transformBackup = clonedElement.style.transform;
//   clonedElement.style.transform = '';
//   let el = helperElement.appendChild(clonedElement);
//   const transformOriginBackup = getComputedStyle(el).transformOrigin;
//   clonedElement = null;
//   const cloneBoundingRect = designerCanvas.getNormalizedElementCoordinates(el);
//   const cornerPoints: IPoint[] = [
//     {
//       x: originalRect.x + cloneBoundingRect.x - untransformedCornerPointsOffset,
//       y: originalRect.y + cloneBoundingRect.y - untransformedCornerPointsOffset
//     },
//     {
//       x: originalRect.x + cloneBoundingRect.x + cloneBoundingRect.width + untransformedCornerPointsOffset,
//       y: originalRect.y + cloneBoundingRect.y - untransformedCornerPointsOffset
//     },
//     {
//       x: originalRect.x + cloneBoundingRect.x - untransformedCornerPointsOffset,
//       y: originalRect.y + cloneBoundingRect.y + cloneBoundingRect.height + untransformedCornerPointsOffset
//     },
//     {
//       x: originalRect.x + cloneBoundingRect.x + cloneBoundingRect.width + untransformedCornerPointsOffset,
//       y: originalRect.y + cloneBoundingRect.y + cloneBoundingRect.height + untransformedCornerPointsOffset
//     }
//   ]
//   helperElement.replaceChildren();

//   let cornerPointsTranformOrigins = new Array(4);

//   const transformOrigin = (parseInt(transformOriginBackup.split(' ')[0]) + untransformedCornerPointsOffset).toString() + ' ' + (parseInt(transformOriginBackup.split(' ')[1]) + untransformedCornerPointsOffset).toString();

//   cornerPointsTranformOrigins[0] = (parseInt(transformOrigin.split(' ')[0])).toString() + ' ' + (parseInt(transformOrigin.split(' ')[1])).toString();
//   cornerPointsTranformOrigins[1] = (cornerPoints[0].x - cornerPoints[1].x + parseInt(transformOrigin.split(' ')[0])).toString() + ' ' + (parseInt(transformOrigin.split(' ')[1])).toString();
//   cornerPointsTranformOrigins[2] = (parseInt(transformOrigin.split(' ')[0])).toString() + ' ' + (cornerPoints[0].y - cornerPoints[2].y + parseInt(transformOrigin.split(' ')[1])).toString();
//   cornerPointsTranformOrigins[3] = (cornerPoints[0].x - cornerPoints[1].x + parseInt(transformOrigin.split(' ')[0])).toString() + ' ' + (cornerPoints[0].y - cornerPoints[2].y + parseInt(transformOrigin.split(' ')[1])).toString();

//   const cornerDivs: HTMLDivElement[] = [];
//   let element: HTMLDivElement;

//   for (let i = 0; i < cornerPointsTranformOrigins.length; i++) {
//     element = document.createElement('div');
//     element.style.visibility = 'hidden';
//     element.style.position = 'absolute';
//     element.style.width = "1px";
//     element.style.height = "1px";
//     element.style.top = cornerPoints[i].y.toString() + 'px';
//     element.style.left = cornerPoints[i].x.toString() + 'px';
//     element.style.transformOrigin = cornerPointsTranformOrigins[i].split(' ')[0] + 'px' + ' ' + cornerPointsTranformOrigins[i].split(' ')[1] + 'px';
//     cornerDivs.push(helperElement.appendChild(element));
//   }

//   let transformedCornerPoints: IPoint3D[] = [];

//   for (let i = 0; i < cornerDivs.length; i++) {
//     //let transformedCornerDiv: HTMLElement;
//     let transformedCornerPoint: IPoint3D = { x: null, y: null, z: null };
//     //transformedCornerDiv = applyMatrixToElement((<HTMLElement>this.extendedItem.element).style.transform, cornerDivs[i]);
//     cornerDivs[i].style.transform = transformBackup;
//     //transformedCornerDiv =  applyMatrixToElement((<HTMLElement>this.extendedItem.element).style.transform, cornerDivs[i]);
//     transformedCornerPoint.x = designerCanvas.getNormalizedElementCoordinates(cornerDivs[i]).x;
//     transformedCornerPoint.y = designerCanvas.getNormalizedElementCoordinates(cornerDivs[i]).y;
//     transformedCornerPoint.z = 0;
//     transformedCornerPoints.push(transformedCornerPoint);
//   }

//   return transformedCornerPoints;
// }


export function getTransformedCornerDOMPoints(originalElement: HTMLElement, untransformedCornerPointsOffset: number, helperElement: HTMLDivElement, designerCanvas: IDesignerCanvas): DOMPoint[] {
  let clone = <HTMLElement>originalElement.cloneNode();

  const topleft = 0;
  const topright = 1;
  const bottomleft = 2;
  const bottomright = 3;

  const originalElementMatrix = new DOMMatrix(getComputedStyle((<HTMLElement>originalElement)).transform);
  clone.style.visibility = 'hidden';
  clone.style.transform = '';
  let appendedClone = helperElement.appendChild(clone);
  clone = null;

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

  helperElement.replaceChildren();

  const transformOriginRelatedToCanvas: DOMPointReadOnly = DOMPointReadOnly.fromPoint(
    {
      x: appendedCloneWithoutTranformRect.x + parseInt(getComputedStyle(<HTMLElement>originalElement).transformOrigin.split(' ')[0]),
      y: appendedCloneWithoutTranformRect.y + parseInt(getComputedStyle(<HTMLElement>originalElement).transformOrigin.split(' ')[1]),
      z: 0,
      w: 0
    }
  )

  let top0 = new DOMPoint(-(transformOriginRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[topleft].x), -(transformOriginRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[topleft].y));
  let top1 = new DOMPoint(-(transformOriginRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[topright].x), -(transformOriginRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[topright].y));
  let top2 = new DOMPoint(-(transformOriginRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[bottomleft].x), -(transformOriginRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[bottomleft].y));
  let top3 = new DOMPoint(-(transformOriginRelatedToCanvas.x - appendedCloneWithoutTranformCornerDOMPoints[bottomright].x), -(transformOriginRelatedToCanvas.y - appendedCloneWithoutTranformCornerDOMPoints[bottomright].y));

  let top0Transformed = top0.matrixTransform(originalElementMatrix);
  let top1Transformed = top1.matrixTransform(originalElementMatrix);
  let top2Transformed = top2.matrixTransform(originalElementMatrix);
  let top3Transformed = top3.matrixTransform(originalElementMatrix);

  let transformedCornerPoints: DOMPoint[] = [];
  transformedCornerPoints[0] = new DOMPoint(transformOriginRelatedToCanvas.x + top0Transformed.x, transformOriginRelatedToCanvas.y + top0Transformed.y);
  transformedCornerPoints[1] = new DOMPoint(transformOriginRelatedToCanvas.x + top1Transformed.x, transformOriginRelatedToCanvas.y + top1Transformed.y);
  transformedCornerPoints[2] = new DOMPoint(transformOriginRelatedToCanvas.x + top2Transformed.x, transformOriginRelatedToCanvas.y + top2Transformed.y);
  transformedCornerPoints[3] = new DOMPoint(transformOriginRelatedToCanvas.x + top3Transformed.x, transformOriginRelatedToCanvas.y + top3Transformed.y);
 
  return transformedCornerPoints;
}