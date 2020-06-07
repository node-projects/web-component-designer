import { IDesignItem } from "../../item/IDesignItem";
import { IndentedTextWriter } from "../../helper/IndentedTextWriter";
import { IHtmlWriterOptions } from "../../services/serializationService/IHtmlWriterOptions";

export class DomConverter {

  public static normalizeAttributeValue(value: string) {
    return value.replace(/"/g, '&quot;');
  }

  public static normalizeContentValue(value: string) {
    return value.replace(/</g, '&lt;');
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

  public static ConvertToString(designItem: IDesignItem) {
    let itw = new IndentedTextWriter();
    let options: IHtmlWriterOptions = { beautifyOutput: true, writeDesignerProperties: true, compressCssToShorthandProperties: true };

    if (designItem.hasChildren) {
      for (let d of designItem.children()) {
        d.serviceContainer.forSomeServicesTillResult('htmlWriterService', (s) => {
          if (s.canWrite(d))
            s.write(itw, d, options);
        });
      }
    }

    return itw.getString();
  }
}