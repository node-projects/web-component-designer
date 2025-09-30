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

  _createDesignItemsRecursive(item: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, namespace: string, snippet: boolean, positionOffset = 0): IDesignItem {
    let designItem: IDesignItem = null;
    if (item.nodeType == 1) {
      let element: Element;
      let manualCreatedElement = false;
      if (!namespace)
        element = newElementFromString('<' + item.rawTagName + ' ' + item.rawAttrs + '></' + item.rawTagName + '>', instanceServiceContainer.designerCanvas.rootDesignItem.document); // some custom elements only parse attributes during constructor call 
      if (!element) {
        if (namespace)
          element = instanceServiceContainer.designerCanvas.rootDesignItem.document.createElementNS(namespace, item.rawTagName);
        else
          element = instanceServiceContainer.designerCanvas.rootDesignItem.document.createElement(item.rawTagName);
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
        let ns = namespace;
        if (element instanceof SVGSVGElement)
          ns = 'http://www.w3.org/2000/svg';
        else if (element instanceof SVGForeignObjectElement)
          ns = null;
        else if (element instanceof MathMLElement)
          ns = 'http://www.w3.org/1998/Math/MathML';
        let di = this._createDesignItemsRecursive(c, serviceContainer, instanceServiceContainer, ns, snippet, positionOffset);
        designItem._insertChildInternal(di);

        if (di.node instanceof HTMLTemplateElement && di.getAttribute('shadowrootmode') == 'open') {
          try {
            const shadow = (<HTMLElement>designItem.node).attachShadow({ mode: 'open' });
            shadow.appendChild(di.node.content.cloneNode(true));
          } catch (err) {
            console.error("error attaching shadowdom", err)
          }
        }
      }
    } else if (item.nodeType == 3) {
      const parseDiv = instanceServiceContainer.designerCanvas.rootDesignItem.document.createElement("div");
      parseDiv.innerHTML = item.rawText;
      let element = parseDiv.childNodes[0];
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
      if (!snippet && instanceServiceContainer.designItemDocumentPositionService)
        instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start: item.range[0] + positionOffset, length: item.range[1] - item.range[0] });
    } else if (item.nodeType == 8) {
      let element = document.createComment(item.rawText);
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
      if (!snippet && instanceServiceContainer.designItemDocumentPositionService)
        instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start: item.range[0] + positionOffset, length: item.range[1] - item.range[0] });
    }
    if (serviceContainer.designItemService.finishedDesignItem)
      serviceContainer.designItemService.finishedDesignItem(designItem);
    return designItem;
  }
}