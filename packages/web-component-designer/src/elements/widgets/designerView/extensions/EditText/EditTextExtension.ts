import { html, Disposable } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension, toolbarObject } from "../AbstractExtension.js";
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";
import { shadowrootGetSelection, wrapSelectionInSpans } from "../../../../helper/SelectionHelper.js";
import { FontPropertyEditor } from "../../../../services/propertiesService/propertyEditors/FontPropertyEditor.js";
import { getBoundingClientRectAlsoForDisplayContents } from "../../../../helper/ElementHelper.js";

export type handlesPointerEvent = { handlesPointerEvent(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element): boolean }

export class EditTextExtension extends AbstractExtension implements handlesPointerEvent {

  private static template = html`
    <div style="height: 100%; display: flex; gap: 2px; width: 100%;">
      <button data-command="font-weight" data-command-parameter="800" style="pointer-events: auto; height: 24px; width: 24px; padding: 0; font-weight: 900;">b</button>
      <button data-command="font-style" data-command-parameter="italic" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><em>i</em></button>
      <button data-command="text-decoration" data-command-parameter="underline" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><ins>u</ins></button>
      <button data-command="text-decoration" data-command-parameter="line-through" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><del>s</del></button>
      <button data-command="text-decoration" data-command-parameter="overline" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><span style="text-decoration: overline">o</span></button>
      <select data-command="fontSize" style="pointer-events: auto; height: 24px; width: 60px; padding: 0;">
        <option>8px</option>
        <option>9px</option>
        <option>10px</option>
        <option>11px</option>
        <option>12px</option>
        <option>14px</option>
        <option>16px</option>
        <option>18px</option>
        <option>20px</option>
        <option>24px</option>
        <option>28px</option>
        <option>32px</option>
        <option>36px</option>
      </select>
      <select id="fontFamily" data-command="font-family" style="pointer-events: auto; height: 24px; width: 90px; padding: 0;">
        
      </select>
    </div>
  `;

  private _foreignObject: SVGForeignObjectElement;
  private _path: SVGPathElement;
  private _toolbar: toolbarObject;
  private _selectionChangedListener: Disposable;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
    this._keyDown = this._keyDown.bind(this);
  }

  private _keyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.dispose();
    }
  }

  override extend() {
    //TODO: -> check what to do with extensions, do not loose edit on mouse click,...
    //maybe use a html edit framework
    this.extendedItem.instanceServiceContainer.selectionService.clearSelectedElements();
    this.extendedItem.removeDesignerAttributesAndStylesFromChildren();
    window.addEventListener('keydown', this._keyDown, true);
    //@ts-ignore
    this.extendedItem.editContent();

    this._selectionChangedListener = this.extendedItem.instanceServiceContainer.selectionService.onSelectionChanged.on(() => {
      this.commitchanges();
      this.extensionManager.removeExtensionInstance(this.extendedItem, this);
    });

    (<HTMLElement>this.extendedItem.element).focus();

    let itemRect = getBoundingClientRectAlsoForDisplayContents(this.extendedItem.element);

    this._toolbar = this.createToolbar(EditTextExtension.template, 300, 24);
    this._toolbar.updatePosition({ x: (itemRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, y: ((itemRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 36) });

    FontPropertyEditor.addFontsToSelect(this._toolbar.getById<HTMLSelectElement>('fontFamily'));
    this._toolbar.querySelectorAll('button').forEach(x => x.onpointerdown = (e) => {
      this._formatSelection(x.dataset['command'], x.dataset['commandParameter'])
    });
    this._toolbar.querySelectorAll('select').forEach(x => x.onchange = () => this._formatSelection(x.dataset['command'], x.value));

    //TODO - nice way to disable click overlay
    this.designerCanvas.clickOverlay.style.pointerEvents = 'none';

    //overlay to detect click outside
    this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this._path.setAttribute('class', 'svg-edit-text-clickoutside');
    this._path.setAttribute('fill-rule', 'evenodd');
    this._path.style.pointerEvents = 'auto';
    this._path.onpointerdown = (e) => {
      this.designerCanvas.ignoreEvent(e);
      this.commitchanges();
      this.extensionManager.removeExtensionInstance(this.extendedItem, this);
    }
    this._addOverlay(this._path, OverlayLayer.Background);
    this.refresh();
  }

  override refresh() {
    const p = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    if (this._valuesHaveChanges(this.designerCanvas.containerBoundingRect.width, this.designerCanvas.containerBoundingRect.height, this.designerCanvas.scaleFactor, p.p1.x, p.p1.y, p.p2.x, p.p2.y, p.p3.x, p.p3.y, p.p4.x, p.p4.y)) {
      let outsideRect = { width: this.designerCanvas.containerBoundingRect.width / this.designerCanvas.scaleFactor, height: this.designerCanvas.containerBoundingRect.height / this.designerCanvas.scaleFactor };
      let data = "M0 0 L" + outsideRect.width + " 0 L" + outsideRect.width + ' ' + outsideRect.height + " L0 " + outsideRect.height + " Z ";
      data += "M" + [p.p1, p.p2, p.p3, p.p4].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
      this._path.setAttribute("d", data);
    }
  }

  override dispose() {
    window.removeEventListener('keydown', this._keyDown, true);
    this._selectionChangedListener.dispose();
    this._removeAllOverlays();
    this.extendedItem.editContentFinish();
    this.designerCanvas.clickOverlay.style.pointerEvents = 'auto';
  }

  commitchanges() {
    this._removeAllOverlays();

    this.extendedItem.element.normalize();
    let stop = false;
    outer:
    while (!stop) {
      for (let e of this.extendedItem.element.querySelectorAll('*')) {
        if (e.childNodes.length == 0) {
          e.remove();
          continue outer;
        }
      }
      stop = true;
    }

    const newHTML = this.extendedItem.element.innerHTML;

    this.extendedItem.editContentFinish();
    this.extendedItem.innerHTML = newHTML;

    this.designerCanvas.clickOverlay.style.pointerEvents = 'auto';
  }

  handlesPointerEvent(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element): boolean {
    const p = event.composedPath();
    const stylo = this._foreignObject.querySelector('stylo-editor');
    return p.indexOf(stylo) >= 0;
  }

  _formatSelection(type: string, value?: string) {
    const selection = shadowrootGetSelection(this.designerCanvas.rootDesignItem.element.shadowRoot);
    const spans = wrapSelectionInSpans(selection);
    for (const span of spans)
      span.style[type] = value;
    (<HTMLElement>this.extendedItem.element).focus()
  }
}