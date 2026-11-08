import { ColorInput } from '../../../../controls/ColorEditor.js';
import { createSvgStrokeStyleControl, type SvgStrokeStyleControl, type SvgStrokeStyle } from '../../../../controls/SvgStrokeStyleControl.js';
import { mountSvgToolbar } from './SvgToolbarHost.js';
import type { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import type { IDesignItem } from '../../../../item/IDesignItem.js';
import type { IDesignerCanvas } from '../../IDesignerCanvas.js';
import type { IExtensionManager } from '../IExtensionManger.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { DesignItem } from '../../../../item/DesignItem.js';
import { beginSvgPointEditing, endSvgPointEditing, isEditingSvgPoints } from './SvgEditingContext.js';
import { getGeometryReader } from './geometry/GeometryReaderFactory.js';
import { scaleSvgDash } from '../../tools/SvgDrawingHelper.js';
import { SegmentType } from './geometry/IGeometry.js';
import { isVisualSvgElement } from '../../../../helper/SvgHelper.js';

export class SvgEditingToolbarExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(manager: IExtensionManager, canvas: IDesignerCanvas, item: IDesignItem) {
    return !canvas.readOnly && item.element instanceof SVGElement && isVisualSvgElement(item.element)
      && ((canvas.serviceContainer.options.svgEditingMode === 'object' && item.element instanceof SVGSVGElement) || !!getGeometryReader(item.element));
  }
  getExtension(manager: IExtensionManager, canvas: IDesignerCanvas, item: IDesignItem) {
    return new SvgEditingToolbarExtension(manager, canvas, item);
  }
}

class SvgEditingToolbarExtension extends AbstractExtension {
  private toolbar: HTMLDivElement;
  private removeToolbar: () => void;
  private colors = new Map<string, ColorInput>();
  private strokeControls = new Map<SvgStrokeStyle, SvgStrokeStyleControl>();
  private nodeIndex = 0;
  private handleType: 'anchor' | 'cp1' | 'cp2' = 'anchor';
  private selectedHandle = (event: CustomEvent) => {
    this.nodeIndex = event.detail.index;
    this.handleType = event.detail.handleType;
    this.refresh();
  };

  extend() {
    const toolbar = this.toolbar = document.createElement('div');
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'SVG editing');
    toolbar.setAttribute('data-svg-toolbar', '');
    toolbar.style.cssText = 'position:absolute;top:8px;left:8px;max-width:calc(100% - 16px);box-sizing:border-box;z-index:9;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px;background:var(--wcd-tool-popup-background,#fff);color:var(--wcd-color-foreground,#222);border:1px solid var(--wcd-color-border,#888);font:12px sans-serif;pointer-events:auto';
    toolbar.innerHTML = `<style>
      [data-svg-toolbar] label {display:inline-flex;align-items:center;gap:3px}
      [data-svg-toolbar] input,[data-svg-toolbar] select,[data-svg-toolbar] button {height:24px;box-sizing:border-box;font:inherit}
      [data-svg-toolbar] node-projects-color-input {width:34px;height:26px;padding:0}
      [data-svg-toolbar] input[type=number] {width:58px}
      [data-svg-toolbar] .node-controls {display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex-basis:100%}
      [data-svg-toolbar] [hidden] {display:none!important}
    </style>
    <button data-action="edit">Edit points</button>
    <label>Fill <span data-color="fill"></span></label>
    <label>Stroke <span data-color="stroke"></span></label>
    <label>Width <input type="number" min="0" step="0.5" data-style="stroke-width" aria-label="Stroke width"></label>
    <label>Dash <span data-stroke="stroke-dasharray"></span></label>
    <label>Cap <span data-stroke="stroke-linecap"></span></label>
    <label>Join <span data-stroke="stroke-linejoin"></span></label>
    <label>Opacity <input type="number" min="0" max="100" step="5" data-style="opacity" aria-label="SVG opacity"></label>
    <div class="node-controls" hidden>
      <select data-node="index" aria-label="Path node"></select>
      <label>X <input type="number" step="1" data-node="x" aria-label="Node X"></label>
      <label>Y <input type="number" step="1" data-node="y" aria-label="Node Y"></label>
      <select data-node="segment" aria-label="Segment type"><option value="M" disabled>Start point</option><option value="S" disabled>Smooth cubic</option><option value="T" disabled>Smooth quadratic</option><option value="L">Line</option><option value="H">Horizontal</option><option value="V">Vertical</option><option value="Q">Quadratic curve</option><option value="C">Cubic curve</option><option value="A">Arc</option></select>
      <button data-action="insert">Add node</button><button data-action="delete">Delete node</button><button data-action="close">Close path</button>
      <span>Drag nodes · Shift: axis lock · Alt: no snapping</span>
    </div>`;
    for (const property of ['fill', 'stroke']) {
      const input = new ColorInput();
      input.setAttribute('allow-none', '');
      input.setAttribute('aria-label', property === 'fill' ? 'Fill color' : 'Stroke color');
      input.addEventListener('change', () => this.paint(property, input.value));
      toolbar.querySelector(`[data-color="${property}"]`).append(input);
      this.colors.set(property, input);
    }
    for (const property of ['stroke-dasharray', 'stroke-linecap', 'stroke-linejoin'] as const) {
      const control = createSvgStrokeStyleControl(property, value => {
        if (property === 'stroke-dasharray') {
          this.designerCanvas.serviceContainer.globalContext.strokeDasharray = value;
          this.paint(property, scaleSvgDash(value, parseFloat(getComputedStyle(this.extendedItem.element).strokeWidth)));
        } else this.paint(property, value);
      });
      this.strokeControls.set(property, control);
      toolbar.querySelector(`[data-stroke="${property}"]`).append(control.element);
    }
    toolbar.onpointerdown = event => { this.designerCanvas.ignoreEvent(event); event.stopPropagation(); };
    toolbar.ondblclick = event => event.stopPropagation();
    toolbar.onkeydown = event => {
      event.stopPropagation();
      if (event.key === 'Escape') endSvgPointEditing(this.designerCanvas);
    };
    toolbar.onclick = event => {
      event.stopPropagation();
      const action = (event.target as HTMLElement).dataset.action;
      if (action === 'edit') {
        if (isEditingSvgPoints(this.designerCanvas, this.extendedItem)) endSvgPointEditing(this.designerCanvas);
        else beginSvgPointEditing(this.designerCanvas, this.extendedItem);
      } else if (action) this.command(action);
    };
    toolbar.onchange = event => {
      const input = event.target as HTMLInputElement;
      if (input.dataset.style) {
        if (input.type === 'number' && (!Number.isFinite(input.valueAsNumber) || !input.checkValidity())) { this.refresh(); return; }
        this.paint(input.dataset.style, input.dataset.style === 'opacity' ? String(input.valueAsNumber / 100) : input.value);
      } else if (input.dataset.node === 'index') {
        this.nodeIndex = Number(input.value);
        this.handleType = 'anchor';
        this.command('select');
      } else if (input.dataset.node === 'segment') this.command(input.value);
      else if (input.dataset.node && Number.isFinite(input.valueAsNumber)) this.command('coordinate', { axis: input.dataset.node, value: input.valueAsNumber });
    };
    this.extendedItem.element.addEventListener('svg-handle-selected', this.selectedHandle);
    this.removeToolbar = mountSvgToolbar(this.designerCanvas, toolbar);
    this.refresh();
  }

  private command(command: string, values = {}) {
    this.extendedItem.element.dispatchEvent(new CustomEvent('svg-geometry-command', {
      detail: { command, index: this.nodeIndex, handleType: this.handleType, ...values }
    }));
    this.refresh();
    this.designerCanvas.clickOverlay.focus();
  }

  private paint(property: string, value: string) {
    if (!CSS.supports(property, value)) return;
    const targets = [this.extendedItem];
    if (this.extendedItem.element instanceof SVGSVGElement && property !== 'opacity') {
      for (const element of this.extendedItem.element.querySelectorAll<SVGElement>('path,rect,circle,ellipse,line,polygon,polyline,text,use')) {
        if (isVisualSvgElement(element)) targets.push(DesignItem.GetOrCreateDesignItem(element, element, this.extendedItem.serviceContainer, this.extendedItem.instanceServiceContainer));
      }
    }
    const group = this.extendedItem.openGroup(`Set SVG ${property}`);
    for (const target of targets) {
      if (property === 'stroke-width') {
        const style = getComputedStyle(target.element);
        if (style.strokeDasharray !== 'none') {
          const ratio = Math.max(Number(value), 1) / Math.max(parseFloat(style.strokeWidth), 1);
          target.setStyle('stroke-dasharray', style.strokeDasharray.replace(/[\d.]+/g, part => String(Number(part) * ratio)));
        }
      }
      target.setStyle(property, value);
    }
    group.commit();
    const context = this.extendedItem.serviceContainer.globalContext;
    if (property === 'fill') context.fillBrush = value;
    else if (property === 'stroke') context.strokeColor = value;
    else if (property === 'stroke-width') context.strokeThickness = value;
    else if (property === 'stroke-linecap') context.strokeLinecap = value as typeof context.strokeLinecap;
    else if (property === 'stroke-linejoin') context.strokeLinejoin = value as typeof context.strokeLinejoin;
    this.refresh();
  }

  refresh() {
    if (!this.toolbar) return;
    const style = getComputedStyle(this.extendedItem.element);
    for (const [property, input] of this.colors) input.value = style.getPropertyValue(property);
    for (const [property, control] of this.strokeControls) {
      let value = style.getPropertyValue(property);
      if (property === 'stroke-dasharray' && value !== 'none') value = value.replace(/px/g, '').split(/[ ,]+/).map(Number)
        .map(part => String(Math.round(part / Math.max(parseFloat(style.strokeWidth), 1) * 1000) / 1000)).join(' ');
      control.setValue(value);
    }
    for (const input of this.toolbar.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-style]')) {
      if (input.matches(':focus')) continue;
      let value = style.getPropertyValue(input.dataset.style);
      if (input.dataset.style === 'opacity') value = String(Number(value) * 100);
      else if (input.dataset.style === 'stroke-width') value = String(parseFloat(value));
      input.value = value;
    }
    const editing = isEditingSvgPoints(this.designerCanvas, this.extendedItem);
    (this.toolbar.querySelector('[data-action="edit"]') as HTMLButtonElement).hidden = this.designerCanvas.serviceContainer.options.svgEditingMode === 'content';
    this.toolbar.querySelector('[data-action="edit"]').textContent = editing ? 'Done (Esc)' : 'Edit points';
    (this.toolbar.querySelector('.node-controls') as HTMLElement).hidden = !editing;
    if (!editing) return;
    const geometry = getGeometryReader(this.extendedItem.element)?.read(this.extendedItem.element);
    if (!geometry) return;
    const nodes = geometry.segments.map((segment, index) => ({ segment, index })).filter(node => node.segment.type !== SegmentType.Close);
    if (!nodes.some(node => node.index === this.nodeIndex)) this.nodeIndex = nodes[0]?.index ?? 0;
    const select = this.toolbar.querySelector('[data-node="index"]') as HTMLSelectElement;
    if (select.options.length !== nodes.length) select.replaceChildren(...nodes.map(node => new Option(`Node ${node.index + 1}`, String(node.index))));
    select.value = String(this.nodeIndex);
    const segment = geometry.segments[this.nodeIndex];
    if (!segment) return;
    const point = this.handleType === 'anchor' ? segment.point : segment[this.handleType] ?? segment.point;
    for (const axis of ['x', 'y'] as const) {
      const input = this.toolbar.querySelector(`[data-node="${axis}"]`) as HTMLInputElement;
      if (!input.matches(':focus')) input.value = String(Math.round(point[axis] * 1000) / 1000);
    }
    let start = this.nodeIndex, end = this.nodeIndex + 1;
    while (start > 0 && geometry.segments[start].type !== SegmentType.Move) start--;
    while (end < geometry.segments.length && geometry.segments[end].type !== SegmentType.Move) end++;
    const closed = geometry.segments[end - 1].type === SegmentType.Close;
    const subpathCount = end - start - (closed ? 1 : 0);
    const isPath = this.extendedItem.element instanceof SVGPathElement;
    const segmentSelect = this.toolbar.querySelector('[data-node="segment"]') as HTMLSelectElement;
    segmentSelect.disabled = !isPath || segment.type === SegmentType.Move;
    segmentSelect.value = segment.type;
    (this.toolbar.querySelector('[data-action="insert"]') as HTMLButtonElement).disabled = !isPath || this.nodeIndex >= nodes[nodes.length - 1].index || ![SegmentType.Line, SegmentType.HorizontalLine, SegmentType.VerticalLine, SegmentType.CubicBezier, SegmentType.QuadraticBezier].includes(geometry.segments[this.nodeIndex + 1]?.type);
    (this.toolbar.querySelector('[data-action="delete"]') as HTMLButtonElement).disabled = !isPath || subpathCount <= 2;
    const close = this.toolbar.querySelector('[data-action="close"]') as HTMLButtonElement;
    close.disabled = !isPath || subpathCount < 3;
    close.textContent = closed ? 'Open path' : 'Close path';
  }

  dispose() {
    this.extendedItem.element.removeEventListener('svg-handle-selected', this.selectedHandle);
    this.removeToolbar?.();
  }
}
