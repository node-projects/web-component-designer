import { IDesignContext } from './IDesignContext.js';

export class DesignContext implements IDesignContext {
  public imports: string[] = [];
  public extensionOptions: { [key: string]: any } = {};
}