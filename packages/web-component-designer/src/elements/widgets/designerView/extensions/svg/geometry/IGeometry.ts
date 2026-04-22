import { IPoint } from '../../../../../../interfaces/IPoint.js';

/**
 * Segment types supported by the geometry model.
 */
export enum SegmentType {
  Move = 'M',
  Line = 'L',
  CubicBezier = 'C',
  QuadraticBezier = 'Q',
  Arc = 'A',
  Close = 'Z',
  HorizontalLine = 'H',
  VerticalLine = 'V',
  SmoothCubic = 'S',
  SmoothQuadratic = 'T',
}

/**
 * A single segment in the geometry. All coordinates are stored as absolute values for internal editing.
 * The `relative` flag preserves whether the original command was relative.
 */
export interface IGeometrySegment {
  /** The segment type */
  type: SegmentType;
  /** Whether the original command was relative (lowercase letter in SVG path) */
  relative: boolean;
  /** The endpoint of this segment (absolute coordinates) */
  point: IPoint;
  /** For cubic bezier: first control point (absolute) */
  cp1?: IPoint;
  /** For cubic bezier: second control point (absolute). For quadratic bezier: the single control point. */
  cp2?: IPoint;
  /** For arc segments */
  arc?: {
    rx: number;
    ry: number;
    rotation: number;
    largeArc: boolean;
    sweep: boolean;
  };
}

export type GeometryWriteTarget = 'attribute' | 'style';

export interface IGeometryWrite {
  attribute: string;
  value: string;
  target?: GeometryWriteTarget;
}

export interface IGeometrySerializationHint {
  target: GeometryWriteTarget;
  unit?: string;
}

/**
 * Abstraction over any editable geometry (SVG shapes, CSS shapes, etc.)
 */
export interface IGeometry {
  /** The segments describing this geometry */
  segments: IGeometrySegment[];
  /** Whether this geometry represents a closed shape */
  closed: boolean;
  /** Optional write-back hints for readers that preserve style-vs-attribute storage */
  serializationHints?: Record<string, IGeometrySerializationHint>;
}

/**
 * Reads element attributes/properties into an IGeometry
 */
export interface IGeometryReader {
  /** Read the element's current geometry */
  read(element: Element): IGeometry;
  /** Write the geometry back to the element as attribute string */
  serialize(geometry: IGeometry): IGeometryWrite[];
}
