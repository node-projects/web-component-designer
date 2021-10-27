import { IndentedTextWriter } from "../../helper/IndentedTextWriter";
import { IDesignItem } from "../../item/IDesignItem";
import { IBinding } from "./IBinding";

/**
 * Can be used to parse bindings wich are done via special HTML Attributes or special Elements
 * If your Bindings are to special, or HTML is not valid with them, maybe you need to parse the Bindings already in the
 * htmlParserService
 */
export interface IBindingService {
  writeBindingMode: 'none' | 'direct' | 'afterElement';
  parseBindingAttribute(attributeName:string, value:string) : IBinding;
  parseBindingCss(attributeName:string, value:string) : IBinding;
  writeBinding(indentedTextWriter: IndentedTextWriter, designItem: IDesignItem, type: 'style' | 'attribute', keyValuePair: [key: string, value: IBinding]): boolean;
}