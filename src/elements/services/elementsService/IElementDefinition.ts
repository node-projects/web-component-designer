import { IBinding } from "../../item/IBinding";

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
  defaultProperties?: { [key: string]: any; };
  defaultWidth?: string;
  defaultHeight?: string;
  ghostElement?: Element;
  /**
   * every component normal get's the property '_inNodeProjectsDesignerView' set. if it should not be the case on this component set this to true
   * a component could have special logic when this is true
   * TODO: maybe remove this, if someone needs such a function, he could use it's own instance provider... 
   */
  doNotSetInNodeProjectsDesignerViewOnInstance?: boolean;
  /**
   * Name of the Tool activated when selecting the element.
   * If none, the DrawElementTool is used
   */
  tool?: string;
  defaultBinding?: IBinding;
}