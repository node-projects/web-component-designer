import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterService } from './IHtmlWriterService.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter.js';
import { CssCombiner } from '../../helper/CssCombiner.js';
import { NodeType } from '../../item/NodeType.js';
import { PropertiesHelper } from '../propertiesService/services/PropertiesHelper.js';
import { ElementDisplayType, getElementDisplaytype } from '../../helper/ElementHelper.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';

export enum ElementContainerType {
  block,
  complex
}

export interface IWriteContext {
  options: IHtmlWriterOptions;
  indentedTextWriter: IndentedTextWriter;
  lastElementDisplayType: ElementDisplayType | null;
  containerDisplayType: ElementContainerType;
}

export class SimpleHtmlWriterService implements IHtmlWriterService {
  public options: IHtmlWriterOptions;

  constructor(options?: IHtmlWriterOptions) {
    this.options = options ?? {};
    this.options.beautifyOutput ??= true;
    this.options.compressCssToShorthandProperties ??= true;
    this.options.writeDesignerProperties ??= true;
    this.options.parseJsonInAttributes ??= true;
    this.options.jsonWriteMode ??= 'min';
  }

  protected writeAttributes(writeContext: IWriteContext, designItem: IDesignItem) {
    if (designItem.hasAttributes) {
      for (const a of designItem.attributes()) {
        writeContext.indentedTextWriter.write(' ');
        if (typeof a[1] === 'string') {
          if (a[1] === "")
            writeContext.indentedTextWriter.write(a[0]);
          else
            writeContext.indentedTextWriter.write(a[0] + '="' + DomConverter.normalizeAttributeValue(a[1]) + '"');
        }
        else if (!a[1])
          writeContext.indentedTextWriter.write(a[0]);
        else {
        }
      }
    }
  }

  protected writeStyles(writeContext: IWriteContext, designItem: IDesignItem) {
    if (designItem.hasStyles) {
      writeContext.indentedTextWriter.write(' style="');
      let styles = designItem.styles();
      if (writeContext.options.compressCssToShorthandProperties)
        styles = CssCombiner.combine(new Map(styles));
      for (const s of styles) {
        if (s[0]) {
          writeContext.indentedTextWriter.write(PropertiesHelper.camelToDashCase(s[0]) + ':' + DomConverter.normalizeAttributeValue(s[1]) + ';');
        }
      }
      writeContext.indentedTextWriter.write('"');
    }
  }

  private _writeTextNode(writeContext: IWriteContext, designItem: IDesignItem) {
    writeContext.lastElementDisplayType = ElementDisplayType.inline;
    let content = DomConverter.normalizeContentValue(designItem.content);
    writeContext.indentedTextWriter.write(content);
  }

  private _writeCommentNode(writeContext: IWriteContext, designItem: IDesignItem) {
    writeContext.indentedTextWriter.write('<!--' + designItem.content + '-->');
  }

  private _writeElementNode(writeContext: IWriteContext, designItem: IDesignItem) {
    const currentElementDisplayType = getElementDisplaytype(<HTMLElement>designItem.element);
    writeContext.lastElementDisplayType = currentElementDisplayType;
    writeContext.indentedTextWriter.write('<' + designItem.name);
    this.writeAttributes(writeContext, designItem);
    this.writeStyles(writeContext, designItem);
    writeContext.indentedTextWriter.write('>');

    if (designItem.hasChildren) {
      const children = designItem.children();
      this._writeDesignItemList(currentElementDisplayType, writeContext, children);
    } else if (designItem.hasContent) {
      writeContext.indentedTextWriter.write(DomConverter.normalizeContentValue(designItem.content));
    }

    if (!DomConverter.IsSelfClosingElement(designItem.name)) {
      writeContext.indentedTextWriter.write('</' + designItem.name + '>');
      if (currentElementDisplayType !== ElementDisplayType.none) {
        writeContext.lastElementDisplayType = currentElementDisplayType;
      }
    }
  }

  private _writeDesignItemList(currentElementDisplayType: ElementDisplayType, writeContext: IWriteContext, children: Iterable<IDesignItem>) {
    for (const c of children) {
      this._writeInternal(writeContext, c);
    }
  }

  private _writeInternal(writeContext: IWriteContext, designItem: IDesignItem) {
    if (designItem.nodeType === NodeType.TextNode)
      this._writeTextNode(writeContext, designItem);
    else if (designItem.nodeType === NodeType.Comment)
      this._writeCommentNode(writeContext, designItem);
    else if (designItem.nodeType === NodeType.Element)
      this._writeElementNode(writeContext, designItem);
  }

  write(indentedTextWriter: IndentedTextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean) {
    const context: IWriteContext = { indentedTextWriter, options: this.options, lastElementDisplayType: null, containerDisplayType: ElementContainerType.block };
    this._writeDesignItemList(ElementDisplayType.inline, context, designItems);
  }
}