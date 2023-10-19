import { IDisposable } from '../../../../interfaces/IDisposable.js';

export interface IDesignerExtension extends IDisposable {
  extend(cache: Record<string|symbol, any>, event?: Event);
  refresh(cache: Record<string|symbol, any>, event?: Event);
}