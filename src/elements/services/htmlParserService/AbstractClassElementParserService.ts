import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { ServiceContainer } from '../ServiceContainer.js';
import { IHtmlParserService } from './IHtmlParserService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { DesignItem } from '../../item/DesignItem.js';
import { CssAttributeParser } from '../../helper/CssAttributeParser.js';
import { newElementFromString } from '../../helper/ElementHelper.js';
import type * as esprima from "esprima-next/dist/esm/esprima";

function* getChildNodes(node: esprima.Node) {
  switch (node.type) {
    case 'Program':
      yield node.body;
      break;
    case 'ClassDeclaration':
      yield node.body;
      break;
    case 'MethodDefinition':
      yield node.value;
      break;
  }
}

//WIP - not yet workin
//Parse HTML inside of Javascript Classes

export abstract class AbstractClassElementParserService implements IHtmlParserService {

  private _parserUrl: string;
  private _esprimaUrl: string;

  constructor(parserUrl = '../../../../../node-html-parser-esm/dist/index.js', esprimaUrl = '../../../../../esprima-next/dist/esm/esprima.js') {
    this._parserUrl = parserUrl;
    this._esprimaUrl = esprimaUrl;
  }


  async parse(module: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    let esprima: typeof import('esprima-next/dist/esm/esprima') = await import(this._esprimaUrl);

    const parsedModule = esprima.parseModule(module);
    const classDecl: esprima.ClassDeclaration = <any>parsedModule.body.find(x => x.type == esprima.Syntax.ClassDeclaration);
    const renderMethod: esprima.MethodDefinition = <any>classDecl.body.body.find(x => x.type == esprima.Syntax.MethodDefinition && (<esprima.Identifier>x.key).name == 'render');
    const renderMethodStatement = <esprima.ReturnStatement>(<esprima.BlockStatement>(<esprima.FunctionExpression>renderMethod.value).body).body[0];
    const taggedTemplate = <esprima.TaggedTemplateExpression>renderMethodStatement.argument;
    const templateLiteral = taggedTemplate.quasi

    //@ts-ignore
    const tmp = getChildNodes(parsedModule);


    const html = templateLiteral.quasis.map(x => x.value.raw).join();

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
      designItem = new DesignItem(element, item, serviceContainer, instanceServiceContainer);

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
      designItem = new DesignItem(element, item, serviceContainer, instanceServiceContainer);
    } else if (item.nodeType == 8) {
      let element = document.createComment(item.rawText);
      designItem = new DesignItem(element, item, serviceContainer, instanceServiceContainer);
    }
    return designItem;
  }
}