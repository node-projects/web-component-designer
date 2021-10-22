import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';
import { ExtensionType } from "./ExtensionType.js";
import { IExtensionManager } from "./IExtensionManger";

export class EditTextExtension extends AbstractExtension {

  private _contentEditedBound: any;
  private _blurBound: any;

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
    this.designerView.disableKeyboardEvents = true;
  }

  override refresh() {
    this.dispose();
  }

  override dispose() {
    this.extensionManager.removeExtension(this.extendedItem, ExtensionType.Doubleclick);
    this.extendedItem.element.removeAttribute('contenteditable');
    this.extendedItem.element.removeEventListener('input', this._contentEditedBound);
    this.extendedItem.element.removeEventListener('blur', this._blurBound);
    this.designerView.disableKeyboardEvents = false;
  }

  _contentEdited() {
    //todo -> save???
    //this.extendedItem.content = this.extendedItem.element.innerHTML;
    //console.log(this.extendedItem.element.innerHTML)
  }

  _blur() {
    this.dispose();
  }
}