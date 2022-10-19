import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterService } from './IHtmlWriterService.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { IStringPosition } from './IStringPosition.js';
import { CssCombiner } from '../../helper/CssCombiner.js';
import { PropertiesHelper } from '../propertiesService/services/PropertiesHelper.js';
import { ITextWriter } from '../../helper/ITextWriter.js';

export abstract class AbstractHtmlWriterService implements IHtmlWriterService {

  abstract write(indentedTextWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, options: IHtmlWriterOptions, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>);

  writeAttributes(indentedTextWriter: ITextWriter, designItem: IDesignItem, options: IHtmlWriterOptions) {
    if (designItem.hasAttributes) {
      for (const a of designItem.attributes) {
        indentedTextWriter.write(' ');
        if (typeof a[1] === 'string') {
          if (a[1] === "")
            indentedTextWriter.write(a[0]);
          else {
            if (options.parseJsonInAttributes && 
                (
                  (a[1].startsWith('{') && !a[1].startsWith('{{') && a[1].endsWith('}')) ||
                  (a[1].startsWith('[') && !a[1].startsWith('[[') && a[1].endsWith(']')))
                ) {
              try {
                let j = JSON.parse(a[1]);
                let txt;
                if (options.jsonWriteMode == 'beauty')
                  txt = JSON.stringify(j, null, 2);
                else
                  txt = JSON.stringify(j);
                indentedTextWriter.write(a[0] + '=\'' + DomConverter.normalizeAttributeValue(txt, true) + '\'');
                continue;
              }
              catch { }
            }
            const content = DomConverter.normalizeAttributeValue(a[1]);
            if (content.indexOf('&quot;')) {
              const contentSingle = DomConverter.normalizeAttributeValue(a[1], true);
              if (contentSingle.length < content.length)
                indentedTextWriter.write(a[0] + '=\'' + contentSingle + '\'');
              else
                indentedTextWriter.write(a[0] + '="' + content + '"');
            } else
              indentedTextWriter.write(a[0] + '="' + content + '"');
          }
        }
        else if (!a[1])
          indentedTextWriter.write(a[0]);
        else {
          //TODO: writing of bindings, really ???
        }
      }
    }
  }

  writeStyles(indentedTextWriter: ITextWriter, designItem: IDesignItem, options: IHtmlWriterOptions) {
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
  }
}