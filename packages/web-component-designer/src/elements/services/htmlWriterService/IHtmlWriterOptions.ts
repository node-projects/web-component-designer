export interface IHtmlWriterOptions {
  beautifyOutput?: boolean;
  compressCssToShorthandProperties?: boolean;
  writeDesignerProperties?: boolean;
  parseJsonInAttributes?: boolean;
  jsonWriteMode?: 'min' | 'beauty';
}