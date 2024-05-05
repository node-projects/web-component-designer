import { TypedEvent } from "@node-projects/base-custom-webcomponent";

export interface IDesignContext {
  imports: string[];
  npmPackages: string[];
  extensionOptions: { [key: string]: any };
  extensionOptionsChanged: TypedEvent<void>;
}