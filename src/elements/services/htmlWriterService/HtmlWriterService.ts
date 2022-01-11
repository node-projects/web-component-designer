import { IDesignItem } from '../../item/IDesignItem';
import { IHtmlWriterService } from './IHtmlWriterService';
import { IHtmlWriterOptions } from './IHtmlWriterOptions';
import { DomConverter } from '../../widgets/designerView/DomConverter';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter';
import { CssCombiner } from '../../helper/CssCombiner';
import { NodeType } from '../../item/NodeType';
import { IStringPosition } from './IStringPosition';
import { PropertiesHelper } from '../propertiesService/services/PropertiesHelper';
import { isEmptyTextNode, isInline } from '../../helper/ElementHelper.js';

export class HtmlWriterService implements IHtmlWriterService {

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

      if (designItem.hasAttributes) {
        for (const a of designItem.attributes) {
          indentedTextWriter.write(' ');
          if (typeof a[1] === 'string') {
            if (a[1] === "")
              indentedTextWriter.write(a[0]);
            else
              indentedTextWriter.write(a[0] + '="' + DomConverter.normalizeAttributeValue(a[1]) + '"');
          }
          else if (!a[1])
            indentedTextWriter.write(a[0]);
          else {
            //TODO: writing of bindings
          }
        }
      }

      if (designItem.hasStyles) {
        indentedTextWriter.write(' style="');
        let styles = designItem.styles;
        if (options.compressCssToShorthandProperties)
          styles = CssCombiner.combine(styles);
        for (const s of styles) {
          if (s[0]) {
            indentedTextWriter.write(PropertiesHelper.camelToDashCase(s[0]) + ':' + DomConverter.normalizeAttributeValue(s[1]) + ';');
          }
        }
        indentedTextWriter.write('"');
      }
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