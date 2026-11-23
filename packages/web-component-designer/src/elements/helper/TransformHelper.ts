let identityMatrix: number[] = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

const placementTransforms = new WeakMap<HTMLElement, { inline: string; priority: string; computed: string }>();

/** Freeze the rendered baseline before a temporary placement transform replaces it. */
export function beginPlacementTransform(element: HTMLElement) {
  const transform = { inline: element.style.transform, priority: element.style.getPropertyPriority('transform'),
    computed: getComputedStyle(element).transform };
  placementTransforms.set(element, transform);
  return transform;
}

export function getPlacementTransform(element: HTMLElement) {
  return placementTransforms.get(element) ?? beginPlacementTransform(element);
}

export function restorePlacementTransform(element: HTMLElement) {
  const transform = getPlacementTransform(element);
  element.style.setProperty('transform', transform.inline, transform.priority);
  placementTransforms.delete(element);
  return transform;
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
  element.style.transform = "matrix3d(" + matrix.join(',') + ")"
}

//maybe remove -> refactor rotate extension
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

export function extractTranslationFromDOMMatrix(matrix: DOMMatrix): DOMPoint {
  //TODO: maybe we also need m43 here??
  return new DOMPoint(matrix.m41, matrix.m42, 0, 0);
}

export function extractRotationAngleFromDOMMatrix(matrix: DOMMatrix): number {
  return getRotationAngleFromMatrix(null, matrix);
}
