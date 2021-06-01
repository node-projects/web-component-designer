import { IDesignItem } from "../../item/IDesignItem";
import { IndentedTextWriter } from "../../helper/IndentedTextWriter";
import { IHtmlWriterOptions } from "../../services/htmlWriterService/IHtmlWriterOptions";
import { IStringPosition } from "../../services/htmlWriterService/IStringPosition";

export class DomConverter {

  public static normalizeAttributeValue(value: string) {
    if (value)
      return value.replace(/"/g, '&quot;');
    return value;
  }

  public static normalizeContentValue(value: string) {
    if (value)
      return value.replace(/</g, '&lt;');
    return value;
  }

  public static IsSelfClosingElement(tag: string) {
    return tag === 'area'   ||
           tag === 'base'   ||
           tag === 'br'     ||
           tag === 'col'    ||
           tag === 'embed'  ||
           tag === 'hr'     ||
           tag === 'iframe' ||
           tag === 'img'    ||
           tag === 'input'  ||
           tag === 'keygen' ||
           tag === 'link'   ||
           tag === 'meta'   ||
           tag === 'param'  ||
           tag === 'source' ||
           tag === 'track'  ||
           tag === 'wbr';
  }

  public static ConvertToString(designItems: IDesignItem[], designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    let itw = new IndentedTextWriter();
    let options: IHtmlWriterOptions = { beautifyOutput: true, writeDesignerProperties: true, compressCssToShorthandProperties: true };

    for (let d of designItems) {
      d.serviceContainer.forSomeServicesTillResult('htmlWriterService', (s) => {
        if (s.canWrite(d))
          s.write(itw, d, options, designItemsAssignmentList);
      });
    }

    return itw.getString();
  }
}