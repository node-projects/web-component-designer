export interface IElementDefinition {
  tag: string;
  name?: string;
  import?: string;
  type?: string;
  defaultContent?: any;
  defaultAttributes?: { [key: string]: string; };
  defaultStyles?: { [key: string]: string; };
  defaultProperties?: { [key: string]: any; };
  defaultWidth?: string;
  defaultHeight?: string;
  ghostElement ?: Element;
  doNotSetInNodeProjectsDesignerViewOnInstance ?: boolean;
}