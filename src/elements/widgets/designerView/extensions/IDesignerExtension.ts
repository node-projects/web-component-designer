import { IDisposable } from '../../../../interfaces/IDisposable.js';

export interface IDesignerExtension extends IDisposable {
  extend();
  refresh();
}