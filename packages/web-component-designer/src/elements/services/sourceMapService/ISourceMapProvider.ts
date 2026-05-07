import { IDesignItem } from '../../item/IDesignItem.js';
import { IStringPosition } from '../htmlWriterService/IStringPosition.js';
import { ISourcePart } from './ISourcePart.js';

export type SourceMapContextKind = 'attribute' | 'style-declaration' | 'text-node';

export interface ISourceMapContext {
  designItem: IDesignItem;
  sourceKind: SourceMapContextKind;
  name?: string;
  value: string;
  valueTextRange: IStringPosition;
}

export interface ISourceMapProvider {
  canMap(context: ISourceMapContext): boolean;
  map(context: ISourceMapContext): ISourcePart[];
}
