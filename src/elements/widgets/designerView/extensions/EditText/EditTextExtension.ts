import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";
import { AbstractExtension } from "../AbstractExtension.js";
import { ExtensionType } from "../ExtensionType.js";
import { IExtensionManager } from "../IExtensionManger";
import { OverlayLayer } from "../OverlayLayer.js";

export class EditTextExtension extends AbstractExtension {

  private _contentEditedBound: any;
  private _blurBound: any;

  private static template = html`
    <div style="height: 24px;">
      <button data-command="bold" style="pointer-events: all; height: 24px; width: 24px; padding: 0; font-weight: 900;">b</button>
      <button data-command="italic" style="pointer-events: all; height: 24px; width: 24px; padding: 0;"><em>i</em></button>
      <button data-command="italic" style="pointer-events: all; height: 24px; width: 24px; padding: 0;"><ins>u</ins></button>
      <button data-command="italic" style="pointer-events: all; height: 24px; width: 24px; padding: 0;"><del>s</del></button>
    </div>
  `;
  private _blurTimeout: NodeJS.Timeout;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);

    this._contentEditedBound = this._contentEdited.bind(this);
    this._blurBound = this._blur.bind(this);
  }

  override extend() {
    //todo -> check what to do with extensions, do not loose edit on mouse click,...
    //maybe use a html edit framework
    this.extendedItem.instanceServiceContainer.selectionService.clearSelectedElements();
    //this.extensionManager.removeExtension(this.extendedItem, ExtensionType.PrimarySelection);
    //this.extensionManager.removeExtension(this.extendedItem, ExtensionType.Selection);
    this.extendedItem.element.setAttribute('contenteditable', '');
    this.extendedItem.element.addEventListener('input', this._contentEditedBound);
    this.extendedItem.element.addEventListener('blur', this._blurBound);
    (<HTMLElement>this.extendedItem.element).focus();
    this.designerView.eatEvents = this.extendedItem.element;

    let itemRect = this.extendedItem.element.getBoundingClientRect();

    const elements = <SVGGraphicsElement>(<any>EditTextExtension.template.content.cloneNode(true));
    elements.querySelectorAll('button').forEach(x => x.onclick = () => this._formatSelection(x.dataset['command']));

    let foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('x', '' + (itemRect.x - this.designerView.containerBoundingRect.x));
    foreignObject.setAttribute('y', '' + (itemRect.y - this.designerView.containerBoundingRect.y - 32));
    foreignObject.setAttribute('width', '50');
    foreignObject.setAttribute('height', '32');
    foreignObject.appendChild(elements)
    this.overlayLayerView.addOverlay(foreignObject, OverlayLayer.Foregorund);
    this.overlays.push(foreignObject);
  }

  override refresh() {
    this.dispose();
  }

  override dispose() {
    this._removeAllOverlays();
    this.extendedItem.element.removeAttribute('contenteditable');
    this.extendedItem.element.removeEventListener('input', this._contentEditedBound);
    this.extendedItem.element.removeEventListener('blur', this._blurBound);
    this.designerView.eatEvents = null;
    this.extendedItem.updateChildrenFromNodesChildren();
  }

  _contentEdited() {
    //todo -> save???
    //this.extendedItem.content = this.extendedItem.element.innerHTML;
    //console.log(this.extendedItem.element.innerHTML)
  }

  _blur() {
    if (!this._blurTimeout) {
      this._blurTimeout = setTimeout(() => {
        this.extensionManager.removeExtension(this.extendedItem, ExtensionType.Doubleclick);
      }, 150);
    }
  }

  _formatSelection(type: string) {
    if (this._blurTimeout)
      clearTimeout(this._blurTimeout);
    this._blurTimeout = null;

    const selection = <Selection>(<any>this.designerView.shadowRoot).getSelection()
    console.log(selection);
    switch (type) {
      case 'bold':
        document.execCommand('bold',false,null);
        break;
    }
    (<HTMLElement>this.extendedItem.element).focus()
  }
}