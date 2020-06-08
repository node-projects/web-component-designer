export interface IDesignerMousePoint {
  x: number // Mouse Position inside of Designer Canvas respecting Zoom
  y: number
  originalX: number // Mouse Position inside of Designer Canvas
  originalY: number
  controlOffsetX: number //Offset of MousePointer in Primary Design Item
  controlOffsetY: number
  zoom?: number 
}