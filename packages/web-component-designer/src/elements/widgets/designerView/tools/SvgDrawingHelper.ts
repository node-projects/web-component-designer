import { DesignItem } from '../../../item/DesignItem.js';
import type { GlobalContext } from '../../../services/GlobalContext.js';
import type { IDesignerCanvas } from '../IDesignerCanvas.js';

export function applySvgDrawingStyle(element: SVGElement, context: GlobalContext, overrides?: { strokeColor?: string, fillBrush?: string, strokeThickness?: string }) {
  element.style.stroke = overrides?.strokeColor ?? context.strokeColor;
  element.style.fill = overrides?.fillBrush ?? context.fillBrush;
  element.style.strokeWidth = overrides?.strokeThickness ?? context.strokeThickness;
  element.style.strokeDasharray = scaleSvgDash(context.strokeDasharray, parseFloat(overrides?.strokeThickness ?? context.strokeThickness));
  element.style.strokeLinecap = context.strokeLinecap;
  element.style.strokeLinejoin = context.strokeLinejoin;
}

export function insertSvgDrawing(canvas: IDesignerCanvas, svg: SVGSVGElement, title = 'Draw SVG') {
  const width = parseFloat(svg.style.width);
  const height = parseFloat(svg.style.height);
  if (canvas.serviceContainer.options.svgEditingMode === 'object') svg.setAttribute('data-svg-object', '');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  const item = DesignItem.createDesignItemFromInstance(svg, canvas.serviceContainer, canvas.instanceServiceContainer);
  const group = canvas.rootDesignItem.openGroup(title);
  canvas.rootDesignItem.insertChild(item);
  group.commit();
  canvas.serviceContainer.globalContext.finishedWithTool(canvas.activeTool);
  if (canvas.serviceContainer.options.svgEditingMode === 'content') {
    const geometry = [...item.children(true)].find(child => child.element.matches('path,rect,line,ellipse,circle,polygon,polyline') && !child.element.closest('defs,marker,clipPath,mask,pattern,symbol'));
    canvas.instanceServiceContainer.selectionService.setSelectedElements(geometry ? [geometry] : []);
  } else canvas.instanceServiceContainer.selectionService.setSelectedElements([item]);
  return item;
}

/** Dash presets are expressed in stroke widths, as in graphics editors. */
export function scaleSvgDash(pattern: string, width: number): string {
  return pattern === 'none' ? pattern : pattern.replace(/[\d.]+/g, value => String(Number(value) * Math.max(width || 1, 1)));
}
