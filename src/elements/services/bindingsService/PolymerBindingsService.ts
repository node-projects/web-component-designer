import { IndentedTextWriter } from "../../helper/IndentedTextWriter";
import { IDesignItem } from "../../item/IDesignItem";
import { DomConverter } from "../../widgets/designerView/DomConverter";
import { IBinding } from "./IBinding";
import { IBindingService } from "./IBindingService";
import { BindingMode } from './BindingMode';


export class PolymerBindingsService implements IBindingService {
  writeBindingMode: 'direct' = 'direct';

  parseBindings(designItem: IDesignItem) {
    for (let a of designItem.attributes.entries()) {
      if (typeof a[1] == 'string' && (a[1].startsWith("[[") || a[1].startsWith("{{"))) {
        let bnd: IBinding & { escapeAttribute?: boolean } = {};
        if (a[1].startsWith("[["))
          bnd.mode = BindingMode.oneWay;
        else
          bnd.mode = BindingMode.twoWay;
        bnd.invert = a[1][3] == '!';
        bnd.expression = a[1];
        let nm = a[0];
        if (nm.endsWith('$')) {
          bnd.escapeAttribute = true;
          nm = nm.slice(0, -1);
          designItem.attributes.delete(a[0]);
        }
        designItem.attributes.set(nm, bnd);
      }
    }
  }

  writeBinding(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, type: 'style' | 'attribute', keyValuePair: [key: string, value: IBinding]): boolean {
    indentedTextWriter.write(keyValuePair[0] + '="' + (keyValuePair[1].mode == BindingMode.oneWay ? '[[' : '{{') + DomConverter.normalizeAttributeValue(keyValuePair[1].expression) + (keyValuePair[1].mode == BindingMode.oneWay ? ']]' : ']]') + '"');
    return true;
  }
}