
//TODO: global conext not yet used.
//Service container should not be something with changeing information, so global context is for tool and color (and maybe more)

import { PropertyChangedArgs, TypedEvent } from "@node-projects/base-custom-webcomponent";
import { ITool } from "../widgets/designerView/tools/ITool";

export class GlobalContext {
  private _tool: ITool;
  private _strokeColor: string;
  private _fillBrush: string;

  public set tool(tool: ITool) {
    if (this._tool !== tool) {
      const oldTool = this._tool;
      this._tool = tool;
      this.onToolChanged.emit(new PropertyChangedArgs<ITool>(tool, oldTool));
    }
  }
  public get tool(): ITool {
    return this._tool;
  }
  readonly onToolChanged = new TypedEvent<PropertyChangedArgs<ITool>>();


  public set strokeColor(strokeColor: string) {
    if (this._strokeColor !== strokeColor) {
      const oldStrokeColor = this._strokeColor;
      this._strokeColor = strokeColor;
      this.onStrokeColorChanged.emit(new PropertyChangedArgs<string>(strokeColor, oldStrokeColor));
    }
  }
  public get strokeColor(): string {
    return this._strokeColor;
  }
  readonly onStrokeColorChanged = new TypedEvent<PropertyChangedArgs<string>>();


  public set fillBrush(fillBrush: string) {
    this._fillBrush = fillBrush;
    if (this._fillBrush !== fillBrush) {
      const oldFillBrush = this._fillBrush;
      this._fillBrush = fillBrush;
      this.onFillBrushChanged.emit(new PropertyChangedArgs<string>(fillBrush, oldFillBrush));
    }
  }
  public get fillBrush(): string {
    return this._fillBrush;
  }
  readonly onFillBrushChanged = new TypedEvent<PropertyChangedArgs<string>>();
}