import { IPoint } from "../../index.js";

let identityMatrix = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

export function combineTransforms(helperElement: HTMLElement, element: HTMLElement, transform1: string, transform2: string) {
  if (transform1 == null || transform1 == '') {
    element.style.transform = transform2;
    return;
  }

  helperElement.style.transform = '';
  helperElement.style.transform = transform1;
  const matrix1 = new DOMMatrix(window.getComputedStyle(helperElement).transform);
  helperElement.style.transform = '';
  helperElement.style.transform = transform2;
  const matrix2 = new DOMMatrix(window.getComputedStyle(helperElement).transform);
  const result = matrix2.multiply(matrix1);
  element.style.transform = result.toString();
}

export function getDomMatrix(element: HTMLElement) {
  return new DOMMatrix(window.getComputedStyle(element).transform);
}

export function convertCoordinates(point: IPoint, matrix: DOMMatrix) {
  let domPoint = new DOMPoint(point.x, point.y);
  return domPoint.matrixTransform(matrix.inverse());
}

export function getRotationMatrix3d(element: HTMLElement, axisOfRotation: 'x'| 'y' | 'z' | 'X'| 'Y' | 'Z', angle: number) {
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

export function rotateElementByMatrix3d(element: HTMLElement, matrix: number[]) {
  element.style.transform = matrixArrayToCssMatrix(matrix);
}

export function matrixArrayToCssMatrix(matrixArray: any[]) {
  return "matrix3d(" + matrixArray.join(',') + ")";
}

export function cssMatrixToMatrixArray(cssMatrix: string) {
  if (!cssMatrix.includes('matrix')) {
    console.error('cssMatrixToMatrixArray: no css matrix passed');
    return identityMatrix;
  }
  let matrixArray = cssMatrix.match(/^matrix.*\((.*)\)/)[1].split(',');
  return matrixArray;
}

export function getRotationAngleFromMatrix(matrixArray: any[]) {
  let angle = null;
  const a = matrixArray[0];
  const b = matrixArray[1];
  angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
  
  //return (angle < 0) ? angle +=360 : angle;
  return angle;
}