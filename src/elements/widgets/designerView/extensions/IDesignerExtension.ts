import { IDisposable } from "../../../../interfaces/IDisposable";

export interface IDesignerExtension extends IDisposable {
  extend();
  refresh();
}