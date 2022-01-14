import { IDesignItem } from "../../item/IDesignItem.js";
import { IndentedTextWriter } from "../../helper/IndentedTextWriter.js";
import { IHtmlWriterOptions } from "../../services/htmlWriterService/IHtmlWriterOptions.js";
import { IStringPosition } from "../../services/htmlWriterService/IStringPosition.js";

export class DomConverter {

  public static normalizeAttributeValue(value: string | number, useSingleQuotes = false) {
    if (typeof value === 'number')
      value = value.toString();
    if (value) {
      if (useSingleQuotes)
        return value.replaceAll('\'', '&#39;');
      return value.replaceAll('"', '&quot;');
    }
    return value;
  }

  public static normalizeContentValue(value: string) {
    if (value)
      return value.replaceAll('<', '&lt;').replaceAll(' ', '&nbsp;');  // !caution! -> this is not normal space, it's nbsp
    return value;
  }

  public static IsSelfClosingElement(tag: string) {
    return tag === 'area' ||
      tag === 'base' ||
      tag === 'br' ||
      tag === 'col' ||
      tag === 'embed' ||
      tag === 'hr' ||
      tag === 'img' ||
      tag === 'input' ||
      tag === 'keygen' ||
      tag === 'link' ||
      tag === 'meta' ||
      tag === 'param' ||
      tag === 'source' ||
      tag === 'track' ||
      tag === 'wbr';
  }

  public static ConvertToString(designItems: IDesignItem[], designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    let itw = new IndentedTextWriter();
    let options: IHtmlWriterOptions = { beautifyOutput: true, writeDesignerProperties: true, compressCssToShorthandProperties: true, parseJsonInAttributes: true, jsonWriteMode: 'beauty' };

    designItems[0].serviceContainer.htmlWriterService.write(itw, designItems, true, options, designItemsAssignmentList);

    return itw.getString();
  }
}