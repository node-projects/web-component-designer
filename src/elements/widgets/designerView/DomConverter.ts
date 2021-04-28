import { IDesignItem } from "../../item/IDesignItem";
import { IndentedTextWriter } from "../../helper/IndentedTextWriter";
import { IHtmlWriterOptions } from "../../services/serializationService/IHtmlWriterOptions";
import { IStringPosition } from "../../services/serializationService/IStringPosition";

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
    return tag === 'area' ||
      tag === 'base' ||
      tag === 'br' ||
      tag === 'col' ||
      tag === 'embed' ||
      tag === 'hr' ||
      tag === 'iframe' ||
      tag === 'img' ||
      tag === 'input' ||
      tag === 'link' ||
      tag === 'meta' ||
      tag === 'param' ||
      tag === 'source' ||
      tag === 'track';
  }

  public static ConvertToString(designItem: IDesignItem, designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    let itw = new IndentedTextWriter();
    let options: IHtmlWriterOptions = { beautifyOutput: true, writeDesignerProperties: true, compressCssToShorthandProperties: true };

    if (designItem.hasChildren) {
      for (let d of designItem.children()) {
        d.serviceContainer.forSomeServicesTillResult('htmlWriterService', (s) => {
          if (s.canWrite(d))
            s.write(itw, d, options, designItemsAssignmentList);
        });
      }
    }

    return itw.getString();
  }
}