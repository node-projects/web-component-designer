import { IndentedTextWriter } from "../../helper/IndentedTextWriter";
import { IDesignItem } from "../../item/IDesignItem";
import { DomConverter } from "../../widgets/designerView/DomConverter";
import { IBinding } from "./IBinding";
import { IBindingService } from "./IBindingService";
import { BindingMode } from './BindingMode';
import { BindingTarget } from './BindingTarget';


export class BaseCustomeWebcomponentBindingsService implements IBindingService {
  writeBindingMode: 'direct' = 'direct';

  parseBindingAttribute(attributeName: string, value: string): IBinding {
    if (value.startsWith("[[") || value.startsWith("{{")) {
      let bnd: IBinding & { escapeAttribute?: boolean } = {};
      bnd.rawName = attributeName;
      bnd.rawValue = value;
      bnd.target = BindingTarget.property;
      if (value.startsWith("[["))
        bnd.mode = BindingMode.oneWay;
      else
        bnd.mode = BindingMode.twoWay;
      bnd.invert = value[3] == '!';
      bnd.nullSafe = value[3] == '?';
      bnd.expression = value;
      return bnd;
    }
    return null;
  }

  parseBindingCss(attributeName: string, value: string): IBinding {
    return null;
  }

  serializeBinding() {

  }

  writeBinding(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, type: 'style' | 'attribute', keyValuePair: [key: string, value: IBinding]): boolean {
    indentedTextWriter.write(keyValuePair[0] + '="' + (keyValuePair[1].mode == BindingMode.oneWay ? '[[' : '{{') + DomConverter.normalizeAttributeValue(keyValuePair[1].expression) + (keyValuePair[1].mode == BindingMode.oneWay ? ']]' : ']]') + '"');
    return true;
  }
}