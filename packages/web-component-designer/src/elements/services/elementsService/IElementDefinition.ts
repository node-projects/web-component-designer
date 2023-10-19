import { IBinding } from '../../item/IBinding.js';

export interface IElementDefinition {
  tag: string;
  name?: string;
  description?: string;
  import?: string;
  className?: string;
  type?: string;
  defaultContent?: any;
  defaultAttributes?: { [key: string]: string; };
  defaultStyles?: { [key: string]: string; };
  defaultWidth?: string;
  defaultHeight?: string;
  ghostElement?: Element;
  /**
   * Name of the Tool activated when selecting the element.
   * If none, the DrawElementTool is used
   */
  tool?: string;
  defaultBinding?: IBinding;
}