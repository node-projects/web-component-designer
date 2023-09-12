export interface IDesignContext {
  imports: string[];
  npmPackages: string[];
  extensionOptions: { [key: string]: any };
}