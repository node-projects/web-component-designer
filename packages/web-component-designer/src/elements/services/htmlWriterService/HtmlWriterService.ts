import { IDesignItem } from '../../item/IDesignItem.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter.js';
import { NodeType } from '../../item/NodeType.js';
import { isEmptyTextNode, isInline, isInlineAfter } from '../../helper/ElementHelper.js';
import { AbstractHtmlWriterService } from './AbstractHtmlWriterService.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';

export class HtmlWriterService extends AbstractHtmlWriterService {
  constructor(options?: IHtmlWriterOptions) {
    super(options);
  }

  private _conditionalyWriteIndent(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem) {
    if ((designItem.element instanceof HTMLElement && !isInlineAfter(designItem.element)) ||
      (designItem.element.previousElementSibling instanceof HTMLElement && !isInline(designItem.element.previousElementSibling)) ||
      (designItem.element.previousElementSibling == null && !isInline(designItem.element.parentElement) && (designItem.element.previousSibling == null || isEmptyTextNode(designItem.element.previousSibling))) ||
      (designItem.element instanceof SVGElement)
    )
      indentedTextWriter.writeIndent();
  }

  private _conditionalyWriteIndentBefore(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem) {
    if ((designItem.element.previousElementSibling instanceof HTMLElement && !isInline(designItem.element.previousElementSibling)) ||
      (designItem.element.previousElementSibling == null && !isInline(designItem.element.parentElement) && (designItem.element.previousSibling == null || isEmptyTextNode(designItem.element.previousSibling))) ||
      (designItem.element instanceof SVGElement)
    )
      indentedTextWriter.writeIndent();
  }

  private _conditionalyWriteNewline(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem) {
    if ((designItem.element instanceof HTMLElement && !isInlineAfter(designItem.element)) ||
      (designItem.element.nextElementSibling instanceof HTMLElement && !isInline(designItem.element.nextElementSibling)) ||
      (designItem.element instanceof SVGElement)
    )
      indentedTextWriter.writeNewline();
  }

  write(indentedTextWriter: IndentedTextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, updatePositions: boolean = false) {
    for (const d of designItems) {
      this.internalWrite(indentedTextWriter, d, updatePositions);
    }
  }

  //TODO: special case for style/script nodes, keep whitespace
  private internalWrite(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, updatePositions: boolean) {
    let start = indentedTextWriter.position;
    let end = indentedTextWriter.position;

    if (designItem.nodeType == NodeType.TextNode) {
      if (isEmptyTextNode(designItem.element) &&
        ((designItem.element.previousSibling instanceof HTMLElement && !isInlineAfter(designItem.element.previousSibling)) ||
          (designItem.element.nextSibling instanceof HTMLElement && !isInline(designItem.element.nextSibling)))) {
      } else
        this.writeTextNode(indentedTextWriter, designItem, true);
      end = indentedTextWriter.position;
    } else if (designItem.nodeType == NodeType.Comment) {
      this._conditionalyWriteIndent(indentedTextWriter, designItem);
      start = indentedTextWriter.position;
      indentedTextWriter.write('<!--' + designItem.content + '-->');
      end = indentedTextWriter.position;
      this._conditionalyWriteNewline(indentedTextWriter, designItem);
    } else {
      this._conditionalyWriteIndentBefore(indentedTextWriter, designItem);
      start = indentedTextWriter.position;
      indentedTextWriter.write('<' + designItem.name);

      this.writeAttributes(indentedTextWriter, designItem);
      this.writeStyles(indentedTextWriter, designItem);

      indentedTextWriter.write('>');

      let contentSingleTextNode = false;
      if (designItem.hasChildren) {
        const children = designItem.children();
        contentSingleTextNode = designItem.childCount === 1 && designItem.firstChild.nodeType === NodeType.TextNode;
        if (contentSingleTextNode) {
          const notrim = designItem.name == 'script' || designItem.name == 'style' || designItem.name == 'pre';
          this.writeTextNode(indentedTextWriter, designItem, false, !notrim);
        } else {
          if (designItem.element instanceof HTMLElement && !isInlineAfter(designItem.element) || (designItem.element instanceof SVGElement)) {
            indentedTextWriter.writeNewline();
            indentedTextWriter.levelRaise();
          }
          for (const c of children) {
            this.internalWrite(indentedTextWriter, c, updatePositions);
            let childSingleTextNode = c.childCount === 1 && c.firstChild.nodeType === NodeType.TextNode;
            if (childSingleTextNode)
              if (!indentedTextWriter.isLastCharNewline())
                this._conditionalyWriteNewline(indentedTextWriter, c);
          }
          if (designItem.element instanceof HTMLElement && !isInlineAfter(designItem.element) || (designItem.element instanceof SVGElement)) {
            indentedTextWriter.levelShrink();
            if (!indentedTextWriter.isLastCharNewline())
              indentedTextWriter.writeNewline();
            indentedTextWriter.writeIndent();
          }
        }
      } else if (designItem.hasContent) {
        indentedTextWriter.write(DomConverter.normalizeContentValue(designItem.content));
        //this._conditionalyWriteNewline(indentedTextWriter, designItem);
      }

      end = indentedTextWriter.position;
      if (!DomConverter.IsSelfClosingElement(designItem.name))
        indentedTextWriter.write('</' + designItem.name + '>');
      end = indentedTextWriter.position;
      //if (!contentSingleTextNode)
      if (!indentedTextWriter.isLastCharNewline() && (!designItem.parent || !isInlineAfter(<HTMLElement>designItem.parent.element)))
        this._conditionalyWriteNewline(indentedTextWriter, designItem);
    }

    if (updatePositions && designItem.instanceServiceContainer.designItemDocumentPositionService) {
      designItem.instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start: start, length: end - start });
    }
  }

  private writeTextNode(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, indentAndNewline: boolean, trim = true) {
    let start = indentedTextWriter.position;
    let end = indentedTextWriter.position;

    let content = DomConverter.normalizeContentValue(designItem.content);
    if (trim)
      content = content.trim();
    if (content) {
      if (indentAndNewline)
        this._conditionalyWriteIndent(indentedTextWriter, designItem);
      indentedTextWriter.write(content);
      if (indentAndNewline)
        this._conditionalyWriteNewline(indentedTextWriter, designItem);
    }
    end = indentedTextWriter.position;

    for (const d of designItem.children())
      designItem.instanceServiceContainer.designItemDocumentPositionService.setPosition(d, { start: start, length: end - start });
  }
}