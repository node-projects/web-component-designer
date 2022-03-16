import { DesignerToolbarPopup } from "../designerToolbarGenerics/designerToolbarPopup";
import { DesignerToolbarPopupToolSelect } from "../designerToolbarGenerics/designerToolbarPopupToolSelect";

export class DrawToolPopup extends DesignerToolbarPopup {
    private _popupcontent : HTMLElement[] = [];
    override ready() {
        this._popupcontent.push(new DesignerToolbarPopupToolSelect());

        this._setTitle(this.getAttribute("title"));
        this._setContent(this._popupcontent);        
    }
}
customElements.define('node-projects-designer-popup-drawtool', DrawToolPopup);