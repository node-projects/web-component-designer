import { css, html } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from '../../../../../../Constants.js';
import type { IDesignerCanvas } from '../../../IDesignerCanvas.js';
import { AbstractBaseToolPopup } from './AbstractBaseToolPopup.js';
import { DrawShapeTool, type SvgShapeDefinition } from '../../DrawShapeTool.js';
import { NamedTools } from '../../NamedTools.js';
import { CommandType } from '../../../../../../commandHandling/CommandType.js';

interface ShapeLibrary { categories: { name: string; shapes: SvgShapeDefinition[] }[]; }
let libraryPromise: Promise<ShapeLibrary>;

export class SvgShapeLibraryPopup extends AbstractBaseToolPopup {
  static override style = [super.style as CSSStyleSheet, css`
    .container {background:var(--wcd-tool-popup-background,#f4f5f6);color:var(--wcd-designer-view-statusbar-color,#27343c);width:330px;max-width:calc(100vw - 80px)}
    main {display:grid;gap:8px}
    input,select {box-sizing:border-box;width:100%;min-width:0;height:28px;font:inherit}
    #grid {display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;max-height:min(330px,45vh);overflow:auto;overscroll-behavior:contain;padding:2px}
    #grid button {height:42px;padding:5px;background:transparent;color:inherit;border:1px solid var(--wcd-color-border,#888);border-radius:3px;cursor:pointer}
    #grid button:hover {background:var(--wcd-designer-view-tool-hover-background,rgba(164,206,249,.6))}
    #grid button:focus-visible {outline:2px solid var(--wcd-color-focus,#47977c)}
    #grid svg {width:100%;height:100%;pointer-events:none;fill:currentColor;stroke:currentColor;stroke-width:1}
    small {line-height:1.4}
  `];
  static override template = html`<div class="container"><header><h2>Shape library</h2></header><main>
    <input id="search" type="search" placeholder="Search all shapes…" aria-label="Search shapes">
    <select id="category" aria-label="Shape category"></select>
    <div id="grid" role="group" aria-label="Predefined shapes"></div>
    <small id="status" role="status">Loading local shapes…</small>
    <small id="drawing-help">Choose a shape, then drag on the canvas. Shift preserves its proportions.</small>
  </main></div>`;
  private library: ShapeLibrary;
  private bounds = new Map<string, { x: number, y: number, width: number, height: number }>();

  constructor(private canvas: IDesignerCanvas) { super(); }

  async ready() {
    if (this.canvas.serviceContainer.options.svgEditingMode === 'object') this._getDomElement('drawing-help').textContent += ' Resize the selected object using its handles; double-click to edit nodes.';
    this._getDomElement<HTMLInputElement>('search').oninput = () => this.renderShapes();
    this._getDomElement<HTMLSelectElement>('category').onchange = () => this.renderShapes();
    try {
      libraryPromise ??= fetch(assetsPath + 'shapes/library.json').then(response => {
        if (!response.ok) throw new Error('Could not load the local shape library.');
        return response.json();
      }).catch(error => { libraryPromise = undefined; throw error; });
      this.library = await libraryPromise;
      if (!this.isConnected) return;
      const select = this._getDomElement<HTMLSelectElement>('category');
      select.replaceChildren(new Option('All categories', ''), ...this.library.categories.map(category => new Option(`${category.name} (${category.shapes.length})`, category.name)));
      select.value = 'Basic';
      this.renderShapes();
    } catch (error) { this._getDomElement('status').textContent = error.message; }
  }

  private renderShapes() {
    if (!this.library) return;
    const query = this._getDomElement<HTMLInputElement>('search').value.trim().toLowerCase();
    const category = this._getDomElement<HTMLSelectElement>('category').value;
    const shapes = this.library.categories.filter(group => query || !category || group.name === category)
      .flatMap(group => group.shapes.filter(shape => !query || `${shape.name} ${group.name}`.toLowerCase().includes(query)));
    const grid = this._getDomElement('grid');
    const previews: { svg: SVGSVGElement, path: SVGPathElement, shape: SvgShapeDefinition }[] = [];
    grid.replaceChildren(...shapes.map(shape => {
      const button = document.createElement('button');
      button.type = 'button';
      button.title = shape.name;
      button.setAttribute('aria-label', `Draw ${shape.name}`);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', shape.path);
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.append(path);
      button.append(svg);
      previews.push({ svg, path, shape });
      button.onclick = () => {
        this.canvas.serviceContainer.designerTools.set(NamedTools.DrawShape, new DrawShapeTool(shape));
        this.canvas.executeCommand({ type: CommandType.setTool, parameter: NamedTools.DrawShape });
        this.remove();
        this.canvas.clickOverlay.focus();
      };
      return button;
    }));
    // Measure the attached paths in one phase, then update their preview viewBoxes.
    for (const preview of previews) {
      if (!this.bounds.has(preview.shape.id)) {
        const box = preview.path.getBBox();
        this.bounds.set(preview.shape.id, { x: box.x, y: box.y, width: Math.max(box.width, 1), height: Math.max(box.height, 1) });
      }
    }
    for (const preview of previews) {
      const box = this.bounds.get(preview.shape.id);
      const margin = Math.max(box.width, box.height) * 0.08;
      preview.svg.setAttribute('viewBox', `${box.x - margin} ${box.y - margin} ${box.width + margin * 2} ${box.height + margin * 2}`);
    }
    this._getDomElement('status').textContent = `${shapes.length} shapes`;
  }
}

customElements.define('node-projects-svg-shape-library', SvgShapeLibraryPopup);
