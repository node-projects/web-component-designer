import { IPoint } from "../../index.js";

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

export function rotateElementByMatrix3d(element: HTMLElement, axisOfRotation: 'x'| 'y' | 'z' | 'X'| 'Y' | 'Z', angle: number) {
  const angleInRadians = angle / 180 * Math.PI;
  const sin = Math.sin;
  const cos = Math.cos;
  let rotateMatrix = [];

  switch (axisOfRotation.toLowerCase()) {
    case 'x': 
      rotateMatrix = [
        1,                    0,                     0,     0,
        0,  cos(angleInRadians),  -sin(angleInRadians),     0,
        0,  sin(angleInRadians),   cos(angleInRadians),     0,
        0,                    0,                     0,     1
      ];
      break;
    case 'y': 
      rotateMatrix = [
         cos(angleInRadians),   0, sin(angleInRadians),   0,
                           0,   1,                   0,   0,
        -sin(angleInRadians),   0, cos(angleInRadians),   0,
                           0,   0,                   0,   1
      ];
      break;
    case 'z': 
    rotateMatrix = [
        cos(angleInRadians), -sin(angleInRadians),    0,    0,
        sin(angleInRadians),  cos(angleInRadians),    0,    0,
                          0,                    0,    1,    0,
                          0,                    0,    0,    1
      ];
      break;
    default:
      rotateMatrix = null;
      break;
  }

  element.style.transform = "matrix3d(" + rotateMatrix.join(',') + ")";

}