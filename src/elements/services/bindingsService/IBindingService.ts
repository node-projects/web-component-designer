import { IDesignItem } from "../../item/IDesignItem";
import { IBinding } from "../../item/IBinding";

/**
 * Can be used to parse bindings wich are done via special HTML Attributes or special Elements
 * If your Bindings are to special, or HTML is not valid with them, maybe you need to parse the Bindings already in the
 * htmlParserService
 */
export interface IBindingService {
  getBindings(designItem: IDesignItem): IBinding[];
  setBinding(designItem: IDesignItem, binding: IBinding): boolean
}