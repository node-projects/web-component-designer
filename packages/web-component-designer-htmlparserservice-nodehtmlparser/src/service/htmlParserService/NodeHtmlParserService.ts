import { IHtmlParserService, ServiceContainer, InstanceServiceContainer, IDesignItem, newElementFromString, DesignItem, CssAttributeParser } from "@node-projects/web-component-designer";
import * as parser from "@node-projects/node-html-parser-esm";
// Alternative Parser, cause when you use the Browser, it instanciates the CusomElements, 
// and some Elements remove attributes from their DOM, so you loose Data
export class NodeHtmlParserService implements IHtmlParserService {

  _designItemCreatedCallback?: (IDesignItem) => void;

  constructor(designItemCreatedCallback?: (IDesignItem) => void) {
    this._designItemCreatedCallback = designItemCreatedCallback;
  }

  async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean, positionOffset = 0): Promise<IDesignItem[]> {
    const parsed = parser.parse(html, { comment: true });

    let designItems: IDesignItem[] = [];
    for (let p of parsed.childNodes) {
      let di = this._createDesignItemsRecursive(p, serviceContainer, instanceServiceContainer, null, parseSnippet, positionOffset);

      if (di != null)
        designItems.push(di)
      else
        console.warn("NodeHtmlParserService - could not parse element", p)
    }
    return designItems;
  }

  private _parseDiv = document.createElement("div");

  _createDesignItemsRecursive(item: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, namespace: string, snippet: boolean, positionOffset = 0): IDesignItem {
    let designItem: IDesignItem = null;
    if (item.nodeType == 1) {
      let element: Element;
      let manualCreatedElement = false;
      if (!namespace)
        element = newElementFromString('<' + item.rawTagName + ' ' + item.rawAttrs + '></' + item.rawTagName + '>'); // some custom elements only parse attributes during constructor call 
      if (!element) {
        if (namespace)
          element = document.createElementNS(namespace, item.rawTagName);
        else
          element = document.createElement(item.rawTagName);
        manualCreatedElement = true;
      }
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
      if (this._designItemCreatedCallback)
        this._designItemCreatedCallback(designItem);
      if (!snippet && instanceServiceContainer.designItemDocumentPositionService)
        instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start: item.range[0] + positionOffset, length: item.range[1] - item.range[0] });

      let style = '';

      let attr = item.attributes;
      for (let a in attr) {
        if (a !== 'style') {
          designItem._withoutUndoSetAttribute(a, attr[a])
          if (manualCreatedElement) {
            element.setAttribute(a, attr[a]);
          }
        } else {
          style = attr[a];
        }
      }

      if ((element instanceof HTMLElement || element instanceof SVGElement) && style) {
        let styleParser = new CssAttributeParser();
        styleParser.parse(style);
        for (let s of styleParser.entries) {
          designItem._withoutUndoSetStyle(s.name, s.value);
          if (manualCreatedElement) {
            element.style[s.name] = s.value;
          }
        }
      }

      if (!designItem.lockAtDesignTime && (<HTMLElement>element).style)
        (<HTMLElement>element).style.pointerEvents = 'auto';
      (<HTMLElement>element).draggable = false; //even if it should be true, for better designer exp.

      for (let c of item.childNodes) {
        let di = this._createDesignItemsRecursive(c, serviceContainer, instanceServiceContainer, element instanceof SVGElement ? 'http://www.w3.org/2000/svg' : null, snippet, positionOffset);
        designItem._insertChildInternal(di);
      }
    } else if (item.nodeType == 3) {
      this._parseDiv.innerHTML = item.rawText;
      let element = this._parseDiv.childNodes[0];
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
      if (!snippet && instanceServiceContainer.designItemDocumentPositionService)
        instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start: item.range[0] + positionOffset, length: item.range[1] - item.range[0] });
    } else if (item.nodeType == 8) {
      let element = document.createComment(item.rawText);
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
      if (!snippet && instanceServiceContainer.designItemDocumentPositionService)
        instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start: item.range[0] + positionOffset, length: item.range[1] - item.range[0] });
    }
    return designItem;
  }
}