//Service container should not be something with changeing information, so global context is for tool and color (and maybe more)

import { PropertyChangedArgs, TypedEvent } from "@node-projects/base-custom-webcomponent";
import { ITool } from "../widgets/designerView/tools/ITool";
import { ServiceContainer } from './ServiceContainer';

export class GlobalContext {

  private _serviceContainer: ServiceContainer
  private _tool: ITool;
  private _strokeColor: string = 'black';
  private _strokeThickness: string = '3';
  private _fillBrush: string = 'transparent';

  constructor(serviceContainer: ServiceContainer) {
    this._serviceContainer = serviceContainer;
  }

  public set tool(tool: ITool) {
    if (this._tool !== tool) {
      const oldTool = this._tool;
      if (oldTool) {
        oldTool.dispose();
      }
      this._tool = tool;
      let toolName = null;
      for (let t of this._serviceContainer.designerTools) {
        if (t[1] == tool)
          toolName = t[0];
      }

      this.onToolChanged.emit(new PropertyChangedArgs<{ name: string, tool: ITool }>({ name: toolName, tool: tool }, { name: null, tool: oldTool }));
      if (this._tool)
        this._tool.activated(this._serviceContainer);
    }
  }
  public get tool(): ITool {
    return this._tool;
  }
  readonly onToolChanged = new TypedEvent<PropertyChangedArgs<{ name: string, tool: ITool }>>();

  finishedWithTool: (tool: ITool) => void = () => this.tool = null;

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

  public set strokeThickness(strokeThickness: string) {
    if (this._strokeThickness !== strokeThickness) {
      const oldStrokeThickness = this._strokeThickness;
      this._strokeThickness = strokeThickness;
      this.onStrokeThicknessChanged.emit(new PropertyChangedArgs<string>(strokeThickness, oldStrokeThickness));
    }
  }
  public get strokeThickness(): string {
    return this._strokeThickness;
  }
  readonly onStrokeThicknessChanged = new TypedEvent<PropertyChangedArgs<string>>();

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