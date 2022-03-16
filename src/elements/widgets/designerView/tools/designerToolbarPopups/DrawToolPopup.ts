import { html, TypedEvent } from "@node-projects/base-custom-webcomponent";
import { assetsPath } from "../../../../../Constants";
import { DesignerToolbarPopup } from "../designerToolbarGenerics/designerToolbarPopup";
import { DesignerToolbarPopupToolSelect } from "../designerToolbarGenerics/designerToolbarPopupToolSelect";
import { AdvancedToolTypeAsArg } from "../designerToolbarGenerics/designerToolsButtons";

export class DrawToolPopup extends DesignerToolbarPopup {

    private readonly templateToolSelect = html`
        <div class="tool" data-command="setTool" popup="draw" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/layout/DrawLineTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/DrawPathTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/layout/DrawRectTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/layout/DrawEllipTool.svg');"></div>
    `; 

    public readonly toolActivated = new TypedEvent<AdvancedToolTypeAsArg>();
    
    override ready() {
        this._setTitle(this.getAttribute("title"));

        let toolSelect = new DesignerToolbarPopupToolSelect();
        toolSelect.insertToolContent(this.templateToolSelect);
        toolSelect.toolActivated.on((toolArg) => {
            this.toolActivated.emit(toolArg);
        })

        let content : HTMLElement[] = [];

        content.push(toolSelect);
        this._setContent(content);        
    }
}
customElements.define('node-projects-designer-popup-drawtool', DrawToolPopup);