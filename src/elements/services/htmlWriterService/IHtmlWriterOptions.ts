export class IHtmlWriterOptions {
  beautifyOutput: boolean = true;
  compressCssToShorthandProperties: boolean = true;
  writeDesignerProperties: boolean = true;
  parseJsonInAttributes: boolean = true;
  jsonWriteMode: 'min' | 'beauty' = 'min';
}