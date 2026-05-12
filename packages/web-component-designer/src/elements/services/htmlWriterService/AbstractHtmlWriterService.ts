import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterService } from './IHtmlWriterService.js';
import { IHtmlWriterOptions } from './IHtmlWriterOptions.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { CssCombiner } from '../../helper/CssCombiner.js';
import { PropertiesHelper } from '../propertiesService/services/PropertiesHelper.js';
import { ITextWriter } from '../../helper/ITextWriter.js';
import { IStringPosition } from './IStringPosition.js';
import { appendCssImportant } from '../../helper/CssImportant.js';

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

  writeAttributes(indentedTextWriter: ITextWriter, designItem: IDesignItem, updatePositions: boolean = false) {
    if (designItem.hasAttributes) {
      for (const a of designItem.attributes()) {
        const attributeStart = indentedTextWriter.position;
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
                const writtenValue = DomConverter.normalizeAttributeValue(txt, true);
                this._writeAttributeWithValue(indentedTextWriter, designItem, a[0], writtenValue, '\'', updatePositions);
                continue;
              }
              catch { }
            }
            const content = DomConverter.normalizeAttributeValue(a[1]);
            if (content.indexOf('&quot;')) {
              const contentSingle = DomConverter.normalizeAttributeValue(a[1], true);
              if (contentSingle.length < content.length)
                this._writeAttributeWithValue(indentedTextWriter, designItem, a[0], contentSingle, '\'', updatePositions);
              else
                this._writeAttributeWithValue(indentedTextWriter, designItem, a[0], content, '"', updatePositions);
            } else
              this._writeAttributeWithValue(indentedTextWriter, designItem, a[0], content, '"', updatePositions);
          }
        }
        else if (!a[1])
          indentedTextWriter.write(a[0]);
        else {
          //TODO: writing of bindings, really ???
        }
        if (updatePositions)
          this._addAttributeSourcePart(designItem, a[0], { start: attributeStart + 1, length: indentedTextWriter.position - attributeStart - 1 });
      }
    }
  }

  private _writeAttributeWithValue(indentedTextWriter: ITextWriter, designItem: IDesignItem, attributeName: string, writtenValue: string, quote: '"' | '\'', updatePositions: boolean) {
    indentedTextWriter.write(attributeName + '=' + quote);
    const valueStart = indentedTextWriter.position;
    indentedTextWriter.write(writtenValue);
    const valueRange = { start: valueStart, length: indentedTextWriter.position - valueStart };
    indentedTextWriter.write(quote);

    if (!updatePositions)
      return;

    const positionService = designItem.instanceServiceContainer.designItemDocumentPositionService;
    positionService.addSourcePart({
      designItem,
      kind: 'attribute-value',
      key: `attribute:${attributeName}/value`,
      name: attributeName,
      textRange: valueRange
    });

    const context = { designItem, sourceKind: 'attribute' as const, name: attributeName, value: writtenValue, valueTextRange: valueRange };
    for (const provider of designItem.serviceContainer.sourceMapProviders) {
      if (provider.canMap(context))
        positionService.addSourceParts(provider.map(context));
    }
  }

  private _addAttributeSourcePart(designItem: IDesignItem, attributeName: string, textRange: IStringPosition) {
    designItem.instanceServiceContainer.designItemDocumentPositionService.addSourcePart({
      designItem,
      kind: 'attribute',
      key: `attribute:${attributeName}`,
      name: attributeName,
      textRange
    });
  }

  writeStyles(indentedTextWriter: ITextWriter, designItem: IDesignItem) {
    if (designItem.hasStyles) {
      indentedTextWriter.write(' style="');
      const styleEntries = [...designItem.styles()];
      const hasImportantStyle = styleEntries.some(x => designItem.isStyleImportant(x[0]));
      let styles: Iterable<[name: string, value: string]> = styleEntries;
      if (this.options.compressCssToShorthandProperties && !hasImportantStyle)
        styles = CssCombiner.combine(new Map(styleEntries));
      for (const s of styles) {
        if (s[0]) {
          const value = DomConverter.normalizeAttributeValue(appendCssImportant(s[1], designItem.isStyleImportant(s[0])));
          if (s[0].startsWith('--'))
            indentedTextWriter.write(s[0] + ':' + value + ';');
          else
            indentedTextWriter.write(PropertiesHelper.camelToDashCase(s[0]) + ':' + value + ';');
        }
      }
      indentedTextWriter.write('"');
    }
  }
}
