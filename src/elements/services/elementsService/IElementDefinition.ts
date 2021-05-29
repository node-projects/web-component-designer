export interface IElementDefinition {
  tag: string;
  name?: string;
  description?: string;
  import?: string;
  type?: string;
  defaultContent?: any;
  defaultAttributes?: { [key: string]: string; };
  defaultStyles?: { [key: string]: string; };
  defaultProperties?: { [key: string]: any; };
  defaultWidth?: string;
  defaultHeight?: string;
  ghostElement?: Element;
  doNotSetInNodeProjectsDesignerViewOnInstance?: boolean;
  /**
   * Name of the Tool activated when selecting the element.
   * If none, the DrawElementTool is used
   */
  tool?: string;
}