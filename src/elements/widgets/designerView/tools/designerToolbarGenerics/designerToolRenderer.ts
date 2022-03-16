import { ToolPopupCategoryCollection } from "./designerToolsButtons";

export abstract class DesignerToolRenderer {
    public static createTool(tool: ToolPopupCategoryCollection) {
        let template = document.createElement('template');
        template.innerHTML = "<div class='tool' data-command='setTool' data-command-parameter=" + tool.command_parameter + " popup=" + tool.category + " title=" + tool.title + " style='background-image:" + tool.background_url + ";'></div>";
        return template.content.childNodes[0];
    }
}