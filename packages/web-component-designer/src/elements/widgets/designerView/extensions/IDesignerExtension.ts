import { IDisposable } from '../../../../interfaces/IDisposable.js';

export interface IDesignerExtension extends IDisposable {
  extend(event?: Event);
  refresh(event?: Event);
}