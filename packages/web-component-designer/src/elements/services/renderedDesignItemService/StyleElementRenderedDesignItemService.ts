import { forceActiveAttributeName, forceFocusAttributeName, forceFocusVisibleAttributeName, forceFocusWithinAttributeName, forceHoverAttributeName, forceVisitedAttributeName } from "../../item/DesignItem.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { patchStylesheetSelectorForDesigner } from "../../helper/DesignerStylesheetPatcher.js";
import { IRenderedDesignItemService } from "./IRenderedDesignItemService.js";

export class StyleElementRenderedDesignItemService implements IRenderedDesignItemService {
  updateRenderedDesignItem(designItem: IDesignItem): void {
    const styleDesignItem = this.getStyleDesignItem(designItem);
    if (!styleDesignItem)
      return;

    const patchedContent = this.patchStyleText([...styleDesignItem.children()].map(x => x.content).join(''));
    this.updateStyleElementText(styleDesignItem.element, patchedContent);
    this.updateDeclarativeShadowStyle(styleDesignItem, patchedContent);
    styleDesignItem.instanceServiceContainer.designerCanvas.lazyTriggerReparseDocumentStylesheets();
  }

  updateRenderedNode(node: Node): Node {
    const win = node.ownerDocument?.defaultView ?? window;
    if (node instanceof win.HTMLStyleElement)
      this.updateStyleElementText(node, this.patchStyleText(node.textContent));

    if (node instanceof win.HTMLTemplateElement)
      this.updateRenderedNode(node.content);

    if ('querySelectorAll' in node) {
      for (const styleElement of (<ParentNode>node).querySelectorAll('style')) {
        this.updateStyleElementText(styleElement, this.patchStyleText(styleElement.textContent));
      }
    }
    return node;
  }

  private getStyleDesignItem(designItem: IDesignItem): IDesignItem {
    if (designItem?.name == 'style')
      return designItem;
    if (designItem?.parent?.name == 'style')
      return designItem.parent;
    return null;
  }

  private updateDeclarativeShadowStyle(styleDesignItem: IDesignItem, patchedContent: string) {
    const templateDesignItem = this.getDeclarativeShadowTemplateDesignItem(styleDesignItem);
    if (!templateDesignItem)
      return;

    const host = templateDesignItem.parent?.element as HTMLElement;
    if (!host?.shadowRoot)
      return;

    const sourceStyleElements = [...(<HTMLTemplateElement>templateDesignItem.node).content.querySelectorAll('style')];
    const sourceIndex = sourceStyleElements.indexOf(<HTMLStyleElement>styleDesignItem.node);
    const renderedStyleElements = [...host.shadowRoot.querySelectorAll('style')];
    if (sourceIndex >= 0 && sourceIndex < renderedStyleElements.length)
      this.updateStyleElementText(renderedStyleElements[sourceIndex], patchedContent);
    else
      this.updateRenderedNode(host.shadowRoot);
  }

  private getDeclarativeShadowTemplateDesignItem(designItem: IDesignItem): IDesignItem {
    let current = designItem.parent;
    while (current) {
      const win = current.node.ownerDocument.defaultView ?? window;
      if (current.node instanceof win.HTMLTemplateElement && current.getAttribute('shadowrootmode') == 'open')
        return current;
      current = current.parent;
    }
    return null;
  }

  private updateStyleElementText(styleElement: Element, text: string) {
    if (styleElement.textContent !== text)
      styleElement.textContent = text;
  }

  private patchStyleText(text: string) {
    return patchStylesheetSelectorForDesigner(text, {
      forceHoverAttributeName,
      forceActiveAttributeName,
      forceVisitedAttributeName,
      forceFocusAttributeName,
      forceFocusWithinAttributeName,
      forceFocusVisibleAttributeName
    });
  }
}
