export interface IDesignerMousePoint {
  x: number // Mouse Position inside of Designer Canvas respecting Zoom
  y: number
  //containerOriginalX: number
  originalX: number // Mouse Position inside of Designer Canvas
  //containerOriginalY: number
  originalY: number
  controlOffsetX: number //Offset of MousePointer in Primary Design Item
  controlOffsetY: number
  zoom?: number 
}