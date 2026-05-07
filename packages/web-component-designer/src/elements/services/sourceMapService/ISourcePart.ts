import { IDesignItem } from '../../item/IDesignItem.js';
import { IStringPosition } from '../htmlWriterService/IStringPosition.js';

export type SourcePartKind =
  | 'attribute'
  | 'attribute-value'
  | 'style-declaration'
  | 'style-value'
  | 'svg-path-handle'
  | string;

export interface ISourcePart<TData = unknown> {
  designItem: IDesignItem;
  kind: SourcePartKind;
  key: string;
  name?: string;
  textRange: IStringPosition;
  data?: TData;
}

export interface ISvgPathHandleSourcePartData {
  attribute: 'd';
  segmentIndex: number;
  handleType: 'anchor' | 'cp1' | 'cp2';
}
