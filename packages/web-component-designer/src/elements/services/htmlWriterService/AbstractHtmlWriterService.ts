import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterService } from './IHtmlWriterService.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { CssCombiner } from '../../helper/CssCombiner.js';
import { PropertiesHelper } from '../propertiesService/services/PropertiesHelper.js';
import { ITextWriter } from '../../helper/ITextWriter.js';

export abstract class AbstractHtmlWriterService implements IHtmlWriterService {

  public options: IHtmlWriterOptions;

  constructor(options?: IHtmlWriterOptions) {
    this.options = options ?? {};
    this.options.beautifyOutput ??= true;
    this.options.compressCssToShorthandProperties ??= true;
    this.options.writeDesignerProperties ??= true;
    this.options.parseJsonInAttributes ??= true;
    this.options.jsonWriteMode ??= 'min';
  }

  abstract write(indentedTextWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, updatePositions?: boolean);

  writeAttributes(indentedTextWriter: ITextWriter, designItem: IDesignItem) {
    if (designItem.hasAttributes) {
      for (const a of designItem.attributes()) {
        indentedTextWriter.write(' ');
        if (typeof a[1] === 'string') {
          if (a[1] === "")
            indentedTextWriter.write(a[0]);
          else {
            if (this.options.parseJsonInAttributes &&
              (
                (a[1].startsWith('{') && !a[1].startsWith('{{') && a[1].endsWith('}')) ||
                (a[1].startsWith('[') && !a[1].startsWith('[[') && a[1].endsWith(']')))
            ) {
              try {
                let j = JSON.parse(a[1]);
                let txt;
                if (this.options.jsonWriteMode == 'beauty')
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

  writeStyles(indentedTextWriter: ITextWriter, designItem: IDesignItem) {
    if (designItem.hasStyles) {
      indentedTextWriter.write(' style="');
      let styles = designItem.styles();
      if (this.options.compressCssToShorthandProperties)
        styles = CssCombiner.combine(new Map(styles));
      for (const s of styles) {
        if (s[0]) {
          indentedTextWriter.write(PropertiesHelper.camelToDashCase(s[0]) + ':' + DomConverter.normalizeAttributeValue(s[1]) + ';');
        }
      }
      indentedTextWriter.write('"');
    }
  }
}