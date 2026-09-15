import { IDesignItem } from '../../../item/IDesignItem.js';
import { getElementSize } from '../../../helper/getBoxQuads.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import type { PositionExtensionOptions } from './PositionExtensionProvider.js';

type PositionSide = 'left' | 'right' | 'top' | 'bottom';
const sides: PositionSide[] = ['left', 'right', 'top', 'bottom'];
const oppositeSide: Record<PositionSide, PositionSide> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
type PositionText = [SVGFilterElement, SVGFEFloodElement, SVGTextElement, SVGTextElement];

export class PositionExtension extends AbstractExtension {
  private _lines: SVGLineElement[] = [];
  private _locks: SVGGElement[] = [];
  private _texts: PositionText[] = [];

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem, private readonly _options: PositionExtensionOptions = {}) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  private _getSpecifiedStyle(name: string): string {
    // Resolved getComputedStyle() insets can be pixels even when the side is auto.
    return this.extendedItem.element.computedStyleMap?.().get(name)?.toString()
      ?? this.extendedItem.getStyleFromSheetOrLocal(name) ?? 'auto';
  }

  override refresh() {
    const element = this.extendedItem.element;
    const absolute = this.extendedItem.getComputedStyle().position === 'absolute';
    const container = (absolute ? (<HTMLElement>element).offsetParent : null) ?? this.extendedItem.parent?.element;
    if (!container)
      return;

    const quad = element.getBoxQuads({ relativeTo: container, iframes: this.designerCanvas.iframes })[0];
    if (!quad)
      return;
    const size = getElementSize(container);
    const containerStyle = container.ownerDocument.defaultView.getComputedStyle(container);
    const left = absolute ? parseFloat(containerStyle.borderLeftWidth) || 0 : 0;
    const top = absolute ? parseFloat(containerStyle.borderTopWidth) || 0 : 0;
    const right = size.width - (absolute ? parseFloat(containerStyle.borderRightWidth) || 0 : 0);
    const bottom = size.height - (absolute ? parseFloat(containerStyle.borderBottomWidth) || 0 : 0);
    const midpoint = (a: DOMPoint, b: DOMPoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const ends = [midpoint(quad.p1, quad.p4), midpoint(quad.p2, quad.p3), midpoint(quad.p1, quad.p2), midpoint(quad.p4, quad.p3)];
    const starts = [{ x: left, y: ends[0].y }, { x: right, y: ends[1].y }, { x: ends[2].x, y: top }, { x: ends[3].x, y: bottom }];
    const distances = [ends[0].x - left, right - ends[1].x, ends[2].y - top, bottom - ends[3].y];
    const toCanvas = (point: { x: number, y: number }) => {
      const p = this.designerCanvas.canvas.convertPointFromNode(point, container, { iframes: this.designerCanvas.iframes });
      return { x: p.x / p.w, y: p.y / p.w };
    };
    const canvasStarts = starts.map(toCanvas);
    const canvasEnds = ends.map(toCanvas);
    const centers = starts.map((p, i) => toCanvas({ x: (p.x + ends[i].x) / 2, y: (p.y + ends[i].y) / 2 }));
    const anchored = sides.map(side => this._getSpecifiedStyle(side) !== 'auto');
    const editable = absolute && this._options.allowDocking !== false;
    const scale = this.designerCanvas.scaleFactor;

    if (this._valuesHaveChanges(scale, absolute, editable, ...anchored, ...distances,
      ...canvasStarts.flatMap(p => [p.x, p.y]), ...canvasEnds.flatMap(p => [p.x, p.y]), ...centers.flatMap(p => [p.x, p.y]))) {
      for (let i = 0; i < sides.length; i++) {
        this._lines[i] = this._drawLine(canvasStarts[i].x, canvasStarts[i].y, canvasEnds[i].x, canvasEnds[i].y, 'svg-position', this._lines[i]);
        this._lines[i].style.strokeWidth = '' + 1 / scale;
        this._lines[i].style.strokeDasharray = absolute && anchored[i] ? 'none' : '' + 4 / scale;
        if (absolute) {
          this._drawLock(i, centers[i].x, centers[i].y, anchored[i], editable);
        } else if (this._locks[i]) {
          this._locks[i].style.display = 'none';
        }
        this._texts[i] = this._drawTextWithBackground('' + Math.round(distances[i]), centers[i].x, centers[i].y - (absolute ? 16 / scale : 0), 'white', 'svg-position-text', this._texts[i]);
        this._texts[i][2].style.fontSize = this._texts[i][3].style.fontSize = (12 / scale) + 'px';
      }
    }
  }

  private _drawLock(index: number, x: number, y: number, anchored: boolean, editable: boolean) {
    let lock = this._locks[index];
    if (!lock) {
      lock = this._locks[index] = this._drawGroup('svg-position-lock');
      lock.innerHTML = '<title></title><rect x="-10" y="-10" width="20" height="20" rx="3"/><path/>';
      lock.onpointerdown = event => {
        event.stopPropagation();
        this.designerCanvas.ignoreEvent(event);
      };
      lock.onclick = event => {
        event.stopPropagation();
        this._switchDockingSide(sides[index]);
      };
      lock.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          this._switchDockingSide(sides[index]);
        }
      };
    }
    const target = anchored ? oppositeSide[sides[index]] : sides[index];
    lock.style.display = '';
    lock.style.pointerEvents = editable ? 'all' : 'none';
    lock.style.cursor = editable ? 'pointer' : 'default';
    lock.setAttribute('transform', `translate(${x} ${y}) scale(${1 / this.designerCanvas.scaleFactor})`);
    lock.setAttribute('role', 'button');
    lock.setAttribute('tabindex', editable ? '0' : '-1');
    lock.setAttribute('aria-disabled', '' + !editable);
    lock.setAttribute('aria-pressed', '' + anchored);
    const label = `${sides[index]}: ${anchored ? 'anchored' : 'not anchored'}${editable ? `. Anchor to ${target}` : ''}`;
    lock.setAttribute('aria-label', label);
    lock.querySelector('title').textContent = label;
    lock.querySelector('path').setAttribute('d', (anchored ? 'M-3 -1 V-4 A3 3 0 0 1 3 -4 V-1' : 'M1 -1 V-5 A3 3 0 0 1 7 -5 V-3') + ' M-5 -1 H5 V6 H-5 Z M0 1 V4');
  }

  private _switchDockingSide(side: PositionSide) {
    if (this._options.allowDocking === false)
      return;
    const style = this.extendedItem.getComputedStyle();
    if (style.position !== 'absolute')
      return;
    const target = this._getSpecifiedStyle(side) !== 'auto' ? oppositeSide[side] : side;
    let offset = style.getPropertyValue(target);
    if (!Number.isFinite(parseFloat(offset)))
      return;
    const horizontal = target === 'left' || target === 'right';
    const dimension = horizontal ? 'width' : 'height';
    const size = style.getPropertyValue(dimension);
    const axisSides: PositionSide[] = horizontal ? ['left', 'right'] : ['top', 'bottom'];
    const container = (<HTMLElement>this.extendedItem.element).offsetParent;
    if (container && axisSides.every(side => this._getSpecifiedStyle(side) !== 'auto')) {
      const containerStyle = container.ownerDocument.defaultView.getComputedStyle(container);
      const ignoredSide = horizontal && containerStyle.direction === 'rtl' ? 'left' : axisSides[1];
      if (target === ignoredSide) {
        // Both insets plus a size can overconstrain layout. Derive the ignored inset
        // from the used size and controlling side, since its CSS value may be unused.
        const number = (css: CSSStyleDeclaration, name: string) => parseFloat(css.getPropertyValue(name)) || 0;
        const sum = (css: CSSStyleDeclaration, prefix: string, suffix = '') => axisSides.reduce((value, side) => value + number(css, prefix + side + suffix), 0);
        const containerSize = number(containerStyle, dimension) + (containerStyle.boxSizing === 'border-box'
          ? -sum(containerStyle, 'border-', '-width') : sum(containerStyle, 'padding-'));
        const itemSize = number(style, dimension) + (style.boxSizing === 'border-box'
          ? 0 : sum(style, 'padding-') + sum(style, 'border-', '-width'));
        offset = (containerSize - itemSize - sum(style, 'margin-') - number(style, oppositeSide[target])) + 'px';
      }
    }
    const margins = (horizontal ? ['margin-left', 'margin-right'] : ['margin-top', 'margin-bottom'])
      .filter(name => this._getSpecifiedStyle(name) === 'auto')
      .map(name => [name, style.getPropertyValue(name)]);
    const autoSize = this._getSpecifiedStyle(dimension) === 'auto';
    const group = this.extendedItem.openGroup(`Anchor to ${target}`);
    try {
      // Freeze stretched/shrink-to-fit sizes and auto margins before releasing an inset.
      if (autoSize)
        this.extendedItem.setStyle(dimension, size);
      for (const [name, value] of margins)
        this.extendedItem.setStyle(name, value);
      this.extendedItem.setStyle(target, offset);
      // Explicit auto also overrides an inset from a stylesheet or shorthand.
      this.extendedItem.setStyle(oppositeSide[target], 'auto');
      group.commit();
    } catch (error) {
      group.abort();
      throw error;
    }
    this.extensionManager.refreshAllExtensions([this.extendedItem]);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}
