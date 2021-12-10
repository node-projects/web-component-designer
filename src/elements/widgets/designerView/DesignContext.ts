import { IDesignContext } from "./IDesignContext";

export class DesignContext implements IDesignContext {
  public imports: string[] = [];
  public extensionOptions: { [key: string]: any } = {};
}