import { InstanceServiceContainer } from "../InstanceServiceContainer";
import { ServiceContainer } from "../ServiceContainer";
import { IHtmlParserService } from "./IHtmlParserService";
import { IDesignItem } from '../../item/IDesignItem';
import { DesignItem } from '../../item/DesignItem';
import { CssAttributeParser } from "../../helper/CssAttributeParser";

export class NodeHtmlParserService implements IHtmlParserService {
  async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    //@ts-ignore
    let parser = await import('/node_modules/@node-projects/node-html-parser-esm/dist/index.js');
    const parsed = parser.parse(html, { comment: true });

    let designItems: IDesignItem[] = [];
    for (let p of parsed.childNodes) {
      let di = this._createDesignItemsRecursive(p, serviceContainer, instanceServiceContainer);

      if (di != null)
        designItems.push(di)
      else
        console.warn("NodeHtmlParserService - could not parse element", p)
    }
    return designItems;
  }

  private _parseDiv = document.createElement("div");

  _createDesignItemsRecursive(item: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
    let designItem: IDesignItem = null;
    if (item.nodeType == 1) {
      let element = document.createElement(item.rawTagName);
      designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);

      let hideAtDesignTime = false;
      let hideAtRunTime = false;
      let lockAtDesignTime = false;

      let style = '';

      for (let a in item.attributes) {
        if (a !== 'style') {
          designItem.attributes.set(a, item.attributes[a]);
          if (a === 'node-projects-hide-at-design-time')
            hideAtDesignTime = true;
          if (a === 'node-projects-hide-at-run-time')
            hideAtRunTime = true;
          if (a === 'node-projects-lock-at-design-time')
            lockAtDesignTime = true;
        } else {
          style = item.attributes[a];
        }
      }

      if ((element instanceof HTMLElement || element instanceof SVGElement) && style) {
        let styleParser = new CssAttributeParser();
        styleParser.parse(style);
        for (let s of styleParser.entries) {
          designItem.setStyle(<keyof CSSStyleDeclaration>s.name, s.value);
          //designItem.styles.set(s.name, s.value);
        }
      }

      designItem.hideAtDesignTime = hideAtDesignTime;
      designItem.hideAtRunTime = hideAtRunTime;
      designItem.lockAtDesignTime = lockAtDesignTime;

      (<HTMLElement>element).draggable = false; //even if it should be true, for better designer exp.

      for (let c of item.childNodes) {
        let di = this._createDesignItemsRecursive(c, serviceContainer, instanceServiceContainer);
        (<Node>element).appendChild(di.node);
      }
    } else if (item.nodeType == 3) {
      this._parseDiv.innerHTML = item.rawText;
      let element = this._parseDiv.childNodes[0]; //document.createTextNode(item.rawText);
      designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);
    } else if (item.nodeType == 8) {
      //this._parseDiv.innerHTML = item.rawText;
      let element = document.createComment(item.rawText);
      designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);
    }

    return designItem;
  }
}