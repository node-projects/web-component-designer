import { IPoint } from "../../interfaces/IPoint.js";
import { IRect } from "../../interfaces/IRect.js";

export function isAppleDevice() {
  return window.navigator.platform?.startsWith("Mac") || window.navigator.platform === "iPhone" || window.navigator.platform === "iPad" || window.navigator.platform === "iPod";
}

export function sleep(ms): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function exportData(blob: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.style.display = 'none';
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  await sleep(300);
}

export function dataURItoBlob(dataURI) {
  var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
  var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for (var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], { type: mime });
}

export function pointInRect(point: IPoint, rect: IRect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function removeTrailing(text: string, char: string) {
  if (text.endsWith(char ?? '/'))
    return text.substring(0, text.length - 1);
  return text;
}

export function removeLeading(text: string, char: string) {
  if (text.startsWith(char ?? '/'))
    return text.substring(1);
  return text;
}

export function requestAnimationFramePromise() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

export function arraysEqual<T>(a: T[], b: T[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function setDeepValue(obj, path: string, value) {
  if (path === undefined || path === null) {
      return;
  }

  const pathParts = path.split('.');
  for (let i = 0; i < pathParts.length - 1; i++) {
      if (obj != null) {
          let newObj = obj[pathParts[i]];
          if (newObj == null) {
              newObj = {};
              obj[pathParts[i]] = newObj;
          }
          obj = newObj;
      }
  }

  if (obj != null)
      obj[pathParts[pathParts.length - 1]] = value;
}