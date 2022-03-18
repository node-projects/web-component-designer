import { IPoint } from "../../index.js";
import { IPoint3D } from "../../interfaces/IPoint3d.js";

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

export function convertCoordinates(point: IPoint, matrix: DOMMatrix) {
  let domPoint = new DOMPoint(point.x, point.y);
  return domPoint.matrixTransform(matrix.inverse());
}

export function getRotationMatrix3d(axisOfRotation: 'x'| 'y' | 'z' | 'X'| 'Y' | 'Z', angle: number) {
  const angleInRadians = angle / 180 * Math.PI;
  const sin = Math.sin;
  const cos = Math.cos;
  let rotationMatrix3d = [];

  switch (axisOfRotation.toLowerCase()) {
    case 'x': 
      rotationMatrix3d = [
        1,                    0,                     0,     0,
        0,  cos(angleInRadians),  -sin(angleInRadians),     0,
        0,  sin(angleInRadians),   cos(angleInRadians),     0,
        0,                    0,                     0,     1
      ];
      break;
    case 'y': 
      rotationMatrix3d = [
         cos(angleInRadians),   0, sin(angleInRadians),   0,
                           0,   1,                   0,   0,
        -sin(angleInRadians),   0, cos(angleInRadians),   0,
                           0,   0,                   0,   1
      ];
      break;
    case 'z': 
    rotationMatrix3d = [
        cos(angleInRadians), -sin(angleInRadians),    0,    0,
        sin(angleInRadians),  cos(angleInRadians),    0,    0,
                          0,                    0,    1,    0,
                          0,                    0,    0,    1
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
    1,    0,    0,   0,
    0,    1,    0,   0,
    0,    0,    1,   0,
    deltaX,    deltaY,    deltaZ,   1
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
    console.error('cssMatrixToMatrixArray: no css matrix passed');
    return identityMatrix;
  }
  let matrixArray: number[] = cssMatrix.match(/^matrix.*\((.*)\)/)[1].split(',').map(Number);
  return matrixArray;
}

export function getRotationAngleFromMatrix(matrixArray: number[]) {
  let angle = null;
  const a = matrixArray[0];
  const b = matrixArray[1];
  angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
  
  return angle;
}

export function applyMatrixToPoint(cssMatrix: string, point: {x: number, y: number}) : IPoint3D {
  const transformationMatrix = new DOMMatrix(cssMatrix);
  return {
    x: transformationMatrix.m11 * point.x + transformationMatrix.m21 * point.y,
    y: transformationMatrix.m12 * point.x + transformationMatrix.m22 * point.y,
    z: 0
  }
}