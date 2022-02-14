import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { AbstractExtension } from "../AbstractExtension.js";
import { ExtensionType } from "../ExtensionType.js";
import { IExtensionManager } from "../IExtensionManger";
import { OverlayLayer } from "../OverlayLayer.js";
import { getActiveElement } from "../../../../helper/ElementHelper.js";

export class EditTextWithStyloExtension extends AbstractExtension {

  private _contentEditedBound: any;
  private _blurBound: any;
  private _focusBound: any;

  /*private static style = css`    
  .stylo-container > * {
    white-space: pre-wrap;
  }
  .stylo-container > *:after {
    content: attr(placeholder);
    color: #6e6d6f;
  }`;*/

  private static template = html`
    <stylo-editor></stylo-editor>
  `;
  private _blurTimeout: NodeJS.Timeout;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);

    this._contentEditedBound = this._contentEdited.bind(this);
    this._blurBound = this._blur.bind(this);

    import('@papyrs/stylo/www/build/stylo.esm.js');
  }

  override extend() {
    this.extendedItem.instanceServiceContainer.selectionService.clearSelectedElements();
    this.extendedItem.element.setAttribute('contenteditable', 'true');
    this.extendedItem.element.addEventListener('input', this._contentEditedBound);
    this.extendedItem.element.addEventListener('blur', this._blurBound);
    (<HTMLElement>this.extendedItem.element).focus();
    this.designerCanvas.eatEvents = this.extendedItem.element;

    const elements = <SVGGraphicsElement>(<any>EditTextWithStyloExtension.template.content.cloneNode(true));

    let foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('x', '0');
    foreignObject.setAttribute('y', '0');
    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    foreignObject.appendChild(elements)
    this.overlayLayerView.addOverlay(foreignObject, OverlayLayer.Foregorund);
    this.overlays.push(foreignObject);
    requestAnimationFrame(() => {
      const stylo = foreignObject.querySelector('stylo-editor');
      //@ts-ignore
      stylo.containerRef = this.extendedItem.element;
      //@ts-ignore
      stylo.config = {
        dontInjectHeadCss: true
      };
    });
    this.designerCanvas.clickOverlay.style.pointerEvents = 'none';
  }

  override refresh() {
    this.dispose();
  }

  override dispose() {
    console.log('disposed');
    this._removeAllOverlays();
    this.extendedItem.element.removeAttribute('contenteditable');
    this.extendedItem.element.removeEventListener('input', this._contentEditedBound);
    this.extendedItem.element.removeEventListener('blur', this._blurBound);
    this.extendedItem.element.removeEventListener('focus', this._focusBound);
    this.designerCanvas.eatEvents = null;
    this.extendedItem.updateChildrenFromNodesChildren();
    this.designerCanvas.clickOverlay.style.pointerEvents = 'auto';
  }

  _contentEdited() {
    //this.extendedItem.content = this.extendedItem.element.innerHTML;    
  }

  _blur(e) {
    console.log('blur', e);
    if (!this._blurTimeout) {
      this._blurTimeout = setTimeout(() => {
        //let activeElement = getActiveElement();
        //todo, don't remove doubleclick extension (another type could be used), remove extension itself
        //maybe also configureable when when to remove the extension
        //if (activeElement != this.extendedItem.element)
        //  this.extensionManager.removeExtension(this.extendedItem, ExtensionType.Doubleclick);
        this._blurTimeout = null;
      }, 250);
    }
  }
}