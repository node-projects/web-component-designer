import { ISourceMapContext, ISourceMapProvider } from './ISourceMapProvider.js';
import { ISourcePart, ISvgPathHandleSourcePartData } from './ISourcePart.js';
import { parseSvgPathDataSourceMap } from './SvgPathDataSourceMap.js';

export function createSvgPathHandleSourcePartKey(segmentIndex: number, handleType: ISvgPathHandleSourcePartData['handleType']) {
  return `attribute:d/svg-path/segment:${segmentIndex}/handle:${handleType}`;
}

export class SvgPathSourceMapProvider implements ISourceMapProvider {
  canMap(context: ISourceMapContext): boolean {
    return context.sourceKind === 'attribute'
      && context.name === 'd'
      && context.designItem.element instanceof context.designItem.window.SVGPathElement;
  }

  map(context: ISourceMapContext): ISourcePart<ISvgPathHandleSourcePartData>[] {
    return parseSvgPathDataSourceMap(context.value).map(handleRange => ({
      designItem: context.designItem,
      kind: 'svg-path-handle',
      key: createSvgPathHandleSourcePartKey(handleRange.segmentIndex, handleRange.handleType),
      name: 'd',
      textRange: {
        start: context.valueTextRange.start + handleRange.start,
        length: handleRange.length
      },
      data: {
        attribute: 'd',
        segmentIndex: handleRange.segmentIndex,
        handleType: handleRange.handleType
      }
    }));
  }
}
