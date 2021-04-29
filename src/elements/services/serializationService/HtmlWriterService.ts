import { IDesignItem } from '../../item/IDesignItem';
import { IHtmlWriterService } from './IHtmlWriterService';
import { IHtmlWriterOptions } from './IHtmlWriterOptions';
import { DomConverter } from '../../widgets/designerView/DomConverter';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter';
import { CssCombiner } from '../../helper/CssCombiner';
import { NodeType } from '../../item/NodeType';
import { IStringPosition } from './IStringPosition';

export class HtmlWriterService implements IHtmlWriterService {
  canWrite(designItem: IDesignItem) {
    return true;
  }

  write(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, options: IHtmlWriterOptions, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    let start = indentedTextWriter.position;

    if (designItem.nodeType == NodeType.TextNode) {
      let content = DomConverter.normalizeContentValue(designItem.content).trim();
      if (content) {
        indentedTextWriter.writeIndent();
        indentedTextWriter.write(content);
        indentedTextWriter.writeNewline();
      }
    } else if (designItem.nodeType == NodeType.Comment) {
      indentedTextWriter.writeIndent();
      indentedTextWriter.write('<!--' + designItem.content + '-->');
      indentedTextWriter.writeNewline();
    } else {
      indentedTextWriter.writeIndent();
      indentedTextWriter.write('<' + designItem.name);

      if (designItem.hasAttributes) {
        for (const a of designItem.attributes) {
          indentedTextWriter.write(' ');
          if (a[1])
            indentedTextWriter.write(a[0] + '="' + DomConverter.normalizeAttributeValue(a[1]) + '"');
          else
            indentedTextWriter.write(a[0]);
        }
      }

      if (designItem.hasStyles) {
        indentedTextWriter.write(' style="');
        let styles = designItem.styles;
        if (options.compressCssToShorthandProperties)
          styles = CssCombiner.combine(styles);
        for (const s of styles) {
          if (s[0])
            indentedTextWriter.write(s[0] + ':' + DomConverter.normalizeAttributeValue(s[1]) + ';');
        }
        indentedTextWriter.write('"');
      }
      indentedTextWriter.write('>');

      if (designItem.hasChildren) {
        indentedTextWriter.writeNewline();
        indentedTextWriter.levelRaise();
        for (const c of designItem.children()) {
          c.serviceContainer.forSomeServicesTillResult('htmlWriterService', (s) => {
            if (s.canWrite(c))
              s.write(indentedTextWriter, c, options, designItemsAssignmentList);
          });
        }
        indentedTextWriter.levelShrink();
        indentedTextWriter.writeIndent();
      } else if (designItem.hasContent) {
        //indentedTextWriter.writeNewline();
        //indentedTextWriter.levelRaise();
        indentedTextWriter.write(DomConverter.normalizeContentValue(designItem.content));
        //indentedTextWriter.writeNewline();
        //indentedTextWriter.levelShrink();
        //indentedTextWriter.writeIndent();
      }

      if (!DomConverter.IsSelfClosingElement(designItem.name))
        indentedTextWriter.write('</' + designItem.name + '>');
      indentedTextWriter.writeNewline();
    }

    if (designItemsAssignmentList) {
      designItemsAssignmentList.set(designItem, { start: start, length: indentedTextWriter.position - start - 1 });
    }
  }
}