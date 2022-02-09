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