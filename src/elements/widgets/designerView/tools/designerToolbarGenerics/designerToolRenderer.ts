import { NamedTools } from "../NamedTools";
import { ToolPopupCategoryCollection } from "./designerToolsButtons";

//TODO: rename, this is no renderer, it's a static class so more a helper
export abstract class DesignerToolRenderer {
  public static createToolFromObject(tool: ToolPopupCategoryCollection) {
    let template = document.createElement('template');
    template.innerHTML = "<div class='tool' data-command='setTool' data-command-parameter=" + tool.command_parameter + " popup=" + tool.category + " title=" + tool.title + " style='background-image:" + tool.background_url + ";" + (tool.margin ? "margin: " + tool.margin + ";" : "") + "'></div>";
    return template.content.childNodes[0];
  }

  public static createObjectFromTool(tool: HTMLDivElement) {
    let collector: ToolPopupCategoryCollection = {
      category: tool.getAttribute("popup"),
      command: tool.getAttribute("data-command"),
      command_parameter: tool.getAttribute("data-command-parameter"),
      title: tool.getAttribute("title"),
      tool: <NamedTools>tool.getAttribute("data-command-parameter"),
      background_url: tool.style.backgroundImage,
    }
    return collector
  }
}