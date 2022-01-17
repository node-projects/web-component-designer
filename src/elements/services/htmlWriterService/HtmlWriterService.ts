import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter.js';
import { NodeType } from '../../item/NodeType.js';
import { IStringPosition } from './IStringPosition.js';
import { isEmptyTextNode, isInline } from '../../helper/ElementHelper.js';
import { AbstractHtmlWriterService } from './AbstractHtmlWriterService.js';

export class HtmlWriterService extends AbstractHtmlWriterService {

  private _conditionalyWriteIndent(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem) {
    if ((designItem.element instanceof HTMLElement && !isInline(designItem.element)) ||
      (designItem.element.previousElementSibling instanceof HTMLElement && !isInline(designItem.element.previousElementSibling)) ||
      (designItem.element.previousElementSibling == null && !isInline(designItem.element.parentElement) && (designItem.element.previousSibling == null || isEmptyTextNode(designItem.element.previousSibling)))
    )
      indentedTextWriter.writeIndent();
  }

  private _conditionalyWriteNewline(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem) {
    if ((designItem.element instanceof HTMLElement && !isInline(designItem.element)) ||
      (designItem.element.nextElementSibling instanceof HTMLElement && !isInline(designItem.element.nextElementSibling))
    )
      indentedTextWriter.writeNewline();
  }

  write(indentedTextWriter: IndentedTextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, options: IHtmlWriterOptions, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    for (const d of designItems) {
      this.internalWrite(indentedTextWriter, d, options, designItemsAssignmentList);
    }
  }

  private internalWrite(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, options: IHtmlWriterOptions, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    let start = indentedTextWriter.position;

    if (designItem.nodeType == NodeType.TextNode) {
      if (isEmptyTextNode(designItem.element) &&
        ((designItem.element.previousSibling instanceof HTMLElement && !isInline(designItem.element.previousSibling)) ||
          (designItem.element.nextSibling instanceof HTMLElement && !isInline(designItem.element.nextSibling)))) {
      } else
        this.writeTextNode(indentedTextWriter, designItem, true);
    } else if (designItem.nodeType == NodeType.Comment) {
      this._conditionalyWriteIndent(indentedTextWriter, designItem);
      indentedTextWriter.write('<!--' + designItem.content + '-->');
      this._conditionalyWriteNewline(indentedTextWriter, designItem);
    } else {
      this._conditionalyWriteIndent(indentedTextWriter, designItem);
      indentedTextWriter.write('<' + designItem.name);

      this.writeAttributes(indentedTextWriter, designItem, options);
      this.writeStyles(indentedTextWriter, designItem, options);
      
      indentedTextWriter.write('>');

      let contentSingleTextNode = false;
      if (designItem.hasChildren) {
        const children = designItem.children();
        contentSingleTextNode = designItem.childCount === 1 && designItem.firstChild.nodeType === NodeType.TextNode;
        if (contentSingleTextNode) {
          this.writeTextNode(indentedTextWriter, designItem, false);
        } else {
          if (designItem.element instanceof HTMLElement && !isInline(designItem.element)) {
            indentedTextWriter.writeNewline();
            indentedTextWriter.levelRaise();
          }
          for (const c of children) {
            this.internalWrite(indentedTextWriter, c, options, designItemsAssignmentList);
            let childSingleTextNode = c.childCount === 1 && c.firstChild.nodeType === NodeType.TextNode;
            if (childSingleTextNode)
              indentedTextWriter.writeNewline();
          }
          if (designItem.element instanceof HTMLElement && !isInline(designItem.element)) {
            indentedTextWriter.levelShrink();
            if (!indentedTextWriter.isLastCharNewline())
              indentedTextWriter.writeNewline();
            indentedTextWriter.writeIndent();
          }
        }
      } else if (designItem.hasContent) {
        indentedTextWriter.write(DomConverter.normalizeContentValue(designItem.content));
      }

      if (!DomConverter.IsSelfClosingElement(designItem.name))
        indentedTextWriter.write('</' + designItem.name + '>');
      if (!contentSingleTextNode)
        this._conditionalyWriteNewline(indentedTextWriter, designItem);
    }

    if (designItemsAssignmentList) {
      designItemsAssignmentList.set(designItem, { start: start, length: indentedTextWriter.position - start - 1 });
    }
  }

  private writeTextNode(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, indentAndNewline: boolean) {
    let content = DomConverter.normalizeContentValue(designItem.content).trim();
    if (content) {
      if (indentAndNewline)
        this._conditionalyWriteIndent(indentedTextWriter, designItem);
      indentedTextWriter.write(content);
      if (indentAndNewline)
        this._conditionalyWriteNewline(indentedTextWriter, designItem);
    }
  }
}