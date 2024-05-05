import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IDesignContext } from './IDesignContext.js';

export class DesignContext implements IDesignContext {
  public imports: string[] = [];
  public npmPackages: string[] = [];
  public extensionOptions: { [key: string]: any } = {};
  extensionOptionsChanged = new TypedEvent<void>;
}