export interface IElementDefinition {
  tag: string;
  name?: string;
  import?: string;
  type?: string;
  defaultContent?: any;
  defaultAttributes?: { [key: string]: string; };
  defaultStyles?: { [key: string]: string; };
  defaultWidth?: string;
  defaultHeight?: string;
  ghostElement ?: Element;
  doNotSetInNodeProjectsDesignerViewOnInstance ?: boolean;
}