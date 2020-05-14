export interface IElementDefinition {
  tag: string;
  import?: string;
  type?: string;
  defaultContent?: any;
  defaultAttributes?: any; //([key: string]: any)[]array of key value pairs...
  defaultStyles?: any; //([key: string]: any)[]array of key value pairs...
  defaultWidth?: string
  defaultHeight?: string
}