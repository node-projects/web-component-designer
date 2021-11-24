export interface IDesignerMousePoint {
  x: number // Mouse Position inside of Designer Canvas respecting Zoom
  y: number
  //containerOriginalX: number
  originalX: number // Mouse Position inside of Designer Canvas
  //containerOriginalY: number
  originalY: number
  offsetInControlX: number //Offset of MousePointer in Primary Design Item
  offsetInControlY: number
  zoom?: number
  normalizedX?: number
  normalizedY?: number
}