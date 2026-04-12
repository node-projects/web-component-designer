import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterService } from './IHtmlWriterService.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter.js';
import { CssCombiner } from '../../helper/CssCombiner.js';
import { NodeType } from '../../item/NodeType.js';
import { IStringPosition } from './IStringPosition.js';
import { PropertiesHelper } from '../propertiesService/services/PropertiesHelper.js';
import { ElementDisplayType, getElementDisplaytype } from '../../helper/ElementHelper.js';

enum ElementContainerType {
  inline,
  block,
  complex
}

interface IWriteContext {
  options: IHtmlWriterOptions;
  indentedTextWriter: IndentedTextWriter;
  lastElementDisplayType: ElementDisplayType | null;
  containerDisplayType: ElementContainerType;
  designItemsAssignmentList?: Map<IDesignItem, IStringPosition>;
}

// const defaultDisplayNoneContainerDisplayType: ElementContainerType = ElementContainerType.complex;

export class FormatingHtmlWriterService implements IHtmlWriterService {
  public options: IHtmlWriterOptions;

  constructor(options?: IHtmlWriterOptions) {
    this.options = options ?? {};
    this.options.beautifyOutput ??= true;
    this.options.compressCssToShorthandProperties ??= true;
    this.options.writeDesignerProperties ??= true;
    this.options.parseJsonInAttributes ??= true;
    this.options.jsonWriteMode ??= 'min';
  }

  private writeAttributes(writeContext: IWriteContext, designItem: IDesignItem) {
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

  private writeStyles(writeContext: IWriteContext, designItem: IDesignItem) {
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
    if (writeContext.containerDisplayType === ElementContainerType.inline)
      content = this._normalizeInlineTextContent(content);
    else
      content = content.trim();
    if (content) {
      writeContext.indentedTextWriter.write(content);
    }
  }

  private _normalizeInlineTextContent(content: string) {
    if (!content?.trim())
      return '';

    const hasLeadingWhitespace = /^\s/.test(content);
    const hasTrailingWhitespace = /\s$/.test(content);
    const normalized = content.replaceAll(/[\t\r\n ]+/g, ' ').trim();

    return `${hasLeadingWhitespace ? ' ' : ''}${normalized}${hasTrailingWhitespace ? ' ' : ''}`;
  }

  private _writeCommentNode(writeContext: IWriteContext, designItem: IDesignItem) {
    writeContext.indentedTextWriter.write('<!--' + designItem.content + '-->');
  }

  private _writeElementNode(writeContext: IWriteContext, designItem: IDesignItem) {
//    const cs = getComputedStyle(designItem.element);
//cs.whiteSpace === 'pre'
//isInPre
//is in inline?

    const currentElementDisplayType = getElementDisplaytype(<HTMLElement>designItem.element);
    writeContext.lastElementDisplayType = currentElementDisplayType;
    writeContext.indentedTextWriter.write('<' + designItem.name);
    this.writeAttributes(writeContext, designItem);
    this.writeStyles(writeContext, designItem);
    writeContext.indentedTextWriter.write('>');

    let contentSingleTextNode=false;
    if (designItem.hasChildren) {
      const children = designItem.children();
      contentSingleTextNode = designItem.childCount === 1 && designItem.firstChild.nodeType === NodeType.TextNode;
      let previousContainerDisplayType = writeContext.containerDisplayType;
      writeContext.containerDisplayType = this.getContainerType(<HTMLElement>designItem.element);
      if (contentSingleTextNode) {
        this._writeInternal(writeContext, designItem.firstChild);
      } else {
        if (writeContext.containerDisplayType !== ElementContainerType.inline)
          writeContext.indentedTextWriter.levelRaise();

        this._writeDesignItemList(currentElementDisplayType, writeContext, children)

        if (writeContext.containerDisplayType !== ElementContainerType.inline)
          writeContext.indentedTextWriter.levelShrink();
      }
      writeContext.containerDisplayType = previousContainerDisplayType;
    } else if (designItem.hasContent) {
      writeContext.indentedTextWriter.write(DomConverter.normalizeContentValue(designItem.content));
    }

    if (!DomConverter.IsSelfClosingElement(designItem.name)) {
      if (currentElementDisplayType === ElementDisplayType.block && designItem.hasChildren && !contentSingleTextNode) {
        this._writeNewlineAndIntend(writeContext);
      }
      //write newline & intend ???
      writeContext.indentedTextWriter.write('</' + designItem.name + '>');
      if (currentElementDisplayType !== ElementDisplayType.none) {
        writeContext.lastElementDisplayType = currentElementDisplayType;
      }
    }
  }

  private _writeDesignItemList(currentElementDisplayType: ElementDisplayType, writeContext: IWriteContext, children: Iterable<IDesignItem>) {
    for (const c of children) {
      if (writeContext.lastElementDisplayType == null) {
        //first entry, do nothing
      }
      else if (writeContext.containerDisplayType === ElementContainerType.inline) {
        // Inline containers are whitespace-sensitive. Do not add beautification whitespace.
      }
      else if (writeContext.containerDisplayType === ElementContainerType.complex)
        this._writeNewlineAndIntend(writeContext);
      else if (writeContext.lastElementDisplayType !== ElementDisplayType.inline /*|| currentElementDisplayType !== ElementDisplayType.inline*/)
        this._writeNewlineAndIntend(writeContext);
      this._writeInternal(writeContext, c);
    }
  }

  private _writeNewlineAndIntend(writeContext: IWriteContext) {
    writeContext.indentedTextWriter.writeNewline();
    writeContext.indentedTextWriter.writeIndent();
  }

  private _writeInternal(writeContext: IWriteContext, designItem: IDesignItem) {
    const start = writeContext.indentedTextWriter.position;

    if (designItem.nodeType === NodeType.TextNode)
      this._writeTextNode(writeContext, designItem);
    else if (designItem.nodeType === NodeType.Comment)
      this._writeCommentNode(writeContext, designItem);
    else if (designItem.nodeType === NodeType.Element)
      this._writeElementNode(writeContext, designItem);

    if (writeContext.designItemsAssignmentList) {
      writeContext.designItemsAssignmentList.set(designItem, { start: start, length: writeContext.indentedTextWriter.position - start - 1 });
    }
  }

  getContainerType(element: HTMLElement): ElementContainerType {
    const display = (element.ownerDocument.defaultView ?? window).getComputedStyle(element).display;
    if (display === 'inline')
      return ElementContainerType.inline;
    if (display === 'block' || display === "inline-block" || display == '')
      return ElementContainerType.block;
    return ElementContainerType.complex;
  }

  write(indentedTextWriter: IndentedTextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean) {
    const context: IWriteContext = { indentedTextWriter, options: this.options, lastElementDisplayType: null, containerDisplayType: ElementContainerType.block };
    this._writeDesignItemList(ElementDisplayType.inline, context, designItems);
  }
}