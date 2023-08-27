export const dragDropFormatNameElementDefinition = 'text/json/elementdefintion';
export const dragDropFormatNameBindingObject = 'text/json/bindingobject';
export const dragDropFormatNamePropertyGrid = 'text/json/propertyDrop';
//export const assetsPath = './node_modules/@node-projects/web-component-designer/assets/';

let imporUrl = new URL((import.meta.url));
export var assetsPath = imporUrl.origin + imporUrl.pathname.split('/').slice(0, -1).join('/') + '/../assets/';