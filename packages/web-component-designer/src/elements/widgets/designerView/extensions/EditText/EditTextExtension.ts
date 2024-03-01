import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from "../AbstractExtension.js";
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";
import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from "../../../../helper/TransformHelper.js";
import { shadowrootGetSelection, wrapSelectionInSpans } from "../../../../helper/SelectionHelper.js";
import { FontPropertyEditor } from "../../../../services/propertiesService/propertyEditors/FontPropertyEditor.js";

export type handlesPointerEvent = { handlesPointerEvent(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element): boolean }

export class EditTextExtension extends AbstractExtension implements handlesPointerEvent {

  private static template = html`
    <div style="height: 24px; display: flex; gap: 2px;">
      <button data-command="font-weight" data-command-parameter="800" style="pointer-events: all; height: 24px; width: 24px; padding: 0; font-weight: 900;">b</button>
      <button data-command="font-style" data-command-parameter="italic" style="pointer-events: all; height: 24px; width: 24px; padding: 0;"><em>i</em></button>
      <button data-command="text-decoration" data-command-parameter="underline" style="pointer-events: all; height: 24px; width: 24px; padding: 0;"><ins>u</ins></button>
      <button data-command="text-decoration" data-command-parameter="line-through" style="pointer-events: all; height: 24px; width: 24px; padding: 0;"><del>s</del></button>
      <button data-command="text-decoration" data-command-parameter="overline" style="pointer-events: all; height: 24px; width: 24px; padding: 0;"><span style="text-decoration: overline">o</span></button>
      <select data-command="fontSize" style="pointer-events: all; height: 24px; width: 60px; padding: 0;">
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
      <select id="fontFamily" data-command="font-family" style="pointer-events: all; height: 24px; width: 90px; padding: 0;">
        
      </select>
    </div>
  `;

  private _foreignObject: SVGForeignObjectElement;
  private _path: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    //TODO: -> check what to do with extensions, do not loose edit on mouse click,...
    //maybe use a html edit framework
    this.extendedItem.instanceServiceContainer.selectionService.clearSelectedElements();
    this.extendedItem.removeDesignerAttributesAndStylesFromChildren();
    this.extendedItem.element.setAttribute('contenteditable', '');

    (<HTMLElement>this.extendedItem.element).focus();

    let itemRect = this.extendedItem.element.getBoundingClientRect();

    const elements = <SVGGraphicsElement>(<any>EditTextExtension.template.content.cloneNode(true));
    FontPropertyEditor.addFontsToSelect(elements.querySelector('#fontFamily'));
    elements.querySelectorAll('button').forEach(x => x.onpointerdown = () => this._formatSelection(x.dataset['command'], x.dataset['commandParameter']));
    elements.querySelectorAll('select').forEach(x => x.onchange = () => this._formatSelection(x.dataset['command'], x.value));

    //Button overlay
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    this._foreignObject = foreignObject
    foreignObject.setAttribute('x', '' + (itemRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor);
    foreignObject.setAttribute('y', '' + ((itemRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 30));
    foreignObject.setAttribute('width', '300');
    foreignObject.setAttribute('height', '24');
    foreignObject.appendChild(elements)
    this._addOverlay(foreignObject, OverlayLayer.Foreground);

    //TODO - nice way to disable click overlay
    this.designerCanvas.clickOverlay.style.pointerEvents = 'none';

    //overlay to detect click outside
    this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this._path.setAttribute('class', 'svg-edit-text-clickoutside');
    this._path.setAttribute('fill-rule', 'evenodd');
    this._path.style.pointerEvents = 'auto';
    this._path.onpointerdown = (e) => {
      this.extensionManager.removeExtensionInstance(this.extendedItem, this);
    }
    this._addOverlay(this._path, OverlayLayer.Background);
    let points = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas);
    let outsideRect = { width: this.designerCanvas.containerBoundingRect.width / this.designerCanvas.scaleFactor, height: this.designerCanvas.containerBoundingRect.height / this.designerCanvas.scaleFactor };
    let data = "M0 0 L" + outsideRect.width + " 0 L" + outsideRect.width + ' ' + outsideRect.height + " L0 " + outsideRect.height + " Z ";
    data += "M" + points[0].x + " " + points[0].y + " L" + points[1].x + " " + points[1].y + " L" + points[3].x + " " + points[3].y + " L" + points[2].x + " " + points[2].y + " Z";
    this._path.setAttribute("d", data);
  }

  override refresh() {
    let points = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas);
    let outsideRect = { width: this.designerCanvas.containerBoundingRect.width / this.designerCanvas.scaleFactor, height: this.designerCanvas.containerBoundingRect.height / this.designerCanvas.scaleFactor };
    let data = "M0 0 L" + outsideRect.width + " 0 L" + outsideRect.width + ' ' + outsideRect.height + " L0 " + outsideRect.height + " Z ";
    data += "M" + points[0].x + " " + points[0].y + " L" + points[1].x + " " + points[1].y + " L" + points[3].x + " " + points[3].y + " L" + points[2].x + " " + points[2].y + " Z";
    this._path.setAttribute("d", data);
  }

  override dispose() {
    this._removeAllOverlays();
    this.extendedItem.element.removeAttribute('contenteditable');
    this.extendedItem.updateChildrenFromNodesChildren();

    this.designerCanvas.clickOverlay.style.pointerEvents = 'auto';
  }

  handlesPointerEvent(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element): boolean {
    const p = event.composedPath();
    const stylo = this._foreignObject.querySelector('stylo-editor');
    return p.indexOf(stylo) >= 0;
  }

  _getSelection() {
    let selection = document.getSelection();
    if ((<any>selection).getComposedRanges)
      selection = (<any>selection).getComposedRanges(this.designerCanvas.rootDesignItem.element.shadowRoot);
    else if ((<any>this.designerCanvas.rootDesignItem.element.shadowRoot).getSelection)
      selection = (<any>this.designerCanvas.rootDesignItem.element.shadowRoot).getSelection();
    return selection;
  }

  _formatSelection(type: string, value?: string) {
    const selection = shadowrootGetSelection(this.designerCanvas.rootDesignItem.element.shadowRoot);

    const spans = wrapSelectionInSpans(selection);
    for (const span of spans)
      span.style[type] = value;
    //fallback...
    //document.execCommand(type, false, null);
    (<HTMLElement>this.extendedItem.element).focus()
  }
}