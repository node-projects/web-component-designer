import { CssAttributeParser, DesignItem, IDesignItem, IHtmlParserService, InstanceServiceContainer, ServiceContainer, newElementFromString } from "@node-projects/web-component-designer";
import { BlockStatement, ClassDeclaration, FunctionExpression, Identifier, MethodDefinition, ReturnStatement, TaggedTemplateExpression } from "esprima-next/dist/esm/esprima";
import * as parser from "@node-projects/node-html-parser-esm";
import * as esprima from "esprima-next";

export class LitElementParserService implements IHtmlParserService {
  //TODO: switch to typescript
  constructor() { }

  async parse(module: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean): Promise<IDesignItem[]> {
    const parsedModule = esprima.parseModule(module);
    const classDecl: ClassDeclaration = <any>parsedModule.body.find(x => x.type == esprima.Syntax.ClassDeclaration);
    const renderMethod: MethodDefinition = <any>classDecl.body.body.find(x => x.type == esprima.Syntax.MethodDefinition && (<Identifier>x.key).name == 'render');
    const renderMethodStatement = <ReturnStatement>(<BlockStatement>(<FunctionExpression>renderMethod.value).body).body[0];
    const taggedTemplate = <TaggedTemplateExpression>renderMethodStatement.argument;
    const templateLiteral = taggedTemplate.quasi

    const html = templateLiteral.quasis.map(x => x.value.raw).join();

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
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);

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

      (<HTMLElement>element).draggable = false; //even if it should be true, for better designer exp.

      for (let c of item.childNodes) {
        let di = this._createDesignItemsRecursive(c, serviceContainer, instanceServiceContainer, element instanceof SVGElement ? 'http://www.w3.org/2000/svg' : null);
        designItem._insertChildInternal(di);
      }
    } else if (item.nodeType == 3) {
      this._parseDiv.innerHTML = item.rawText;
      let element = this._parseDiv.childNodes[0];
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
    } else if (item.nodeType == 8) {
      let element = document.createComment(item.rawText);
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
    }
    return designItem;
  }
}