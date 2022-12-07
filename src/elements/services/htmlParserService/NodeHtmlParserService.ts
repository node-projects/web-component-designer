import { InstanceServiceContainer } from "../InstanceServiceContainer";
import { ServiceContainer } from "../ServiceContainer";
import { IHtmlParserService } from "./IHtmlParserService";
import { IDesignItem } from '../../item/IDesignItem';
import { DesignItem } from '../../item/DesignItem';
import { CssAttributeParser } from "../../helper/CssAttributeParser";
import { newElementFromString } from "../../helper/ElementHelper";

// Alternative Parser, cause when you use the Browser, it instanciates the CusomElements, and some Elemnts remove
// attributes from their DOM, so you loose Data
export class NodeHtmlParserService implements IHtmlParserService {

  private _parserUrl: string;

  constructor(parserUrl = '../../../../../node-html-parser-esm/dist/index.js') {
    this._parserUrl = parserUrl;
  }

  async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    //@ts-ignore
    let parser: parser = await import(this._parserUrl);
    const parsed = parser.parse(html, { comment: true });

    let designItems: IDesignItem[] = [];
    for (let p of parsed.childNodes) {
      let di = this._createDesignItemsRecursive(p, serviceContainer, instanceServiceContainer, null);

      if (di != null)
        designItems.push(di)
      else
        console.warn("NodeHtmlParserService - could not parse element", p)
    }
    return designItems;
  }

  private _parseDiv = document.createElement("div");

  _createDesignItemsRecursive(item: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, namespace: string): IDesignItem {
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
      designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);

      let hideAtDesignTime = false;
      let hideAtRunTime = false;
      let lockAtDesignTime = false;

      let style = '';

      let attr = item.attributes;
      for (let a in attr) {
        if (a !== 'style') {
          designItem._withoutUndoSetAttribute(a, attr[a])
          if (manualCreatedElement) {
            element.setAttribute(a, attr[a]);
          }
          if (a === 'node-projects-hide-at-design-time')
            hideAtDesignTime = true;
          else if (a === 'node-projects-hide-at-run-time')
            hideAtRunTime = true;
          else if (a === 'node-projects-lock-at-design-time')
            lockAtDesignTime = true;
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

      if (!lockAtDesignTime && (element instanceof HTMLElement || element instanceof SVGElement)) {
        requestAnimationFrame(() => (<HTMLElement>element).style.pointerEvents = 'auto');
      }

      designItem.hideAtDesignTime = hideAtDesignTime;
      designItem.hideAtRunTime = hideAtRunTime;
      designItem.lockAtDesignTime = lockAtDesignTime;

      (<HTMLElement>element).draggable = false; //even if it should be true, for better designer exp.

      for (let c of item.childNodes) {
        let di = this._createDesignItemsRecursive(c, serviceContainer, instanceServiceContainer, element instanceof SVGElement ? 'http://www.w3.org/2000/svg' : null);
        designItem._insertChildInternal(di);
      }
    } else if (item.nodeType == 3) {
      this._parseDiv.innerHTML = item.rawText;
      let element = this._parseDiv.childNodes[0];
      designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);
    } else if (item.nodeType == 8) {
      let element = document.createComment(item.rawText);
      designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);
    }
    return designItem;
  }
}