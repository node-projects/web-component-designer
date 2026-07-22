import { IBindableObjectsBrowser } from "@node-projects/web-component-designer";

export interface VisualizationShell {
  openConfirmation(element: HTMLElement, options:
    {
      title?: string,
      x?: number,
      y?: number,
      width?: number,
      height?: number,
      parent?: HTMLElement,
      abortSignal?: AbortSignal,
      disableResize?: boolean,
      confirmText?: string,
      cancelText?: string
    }): Promise<boolean>;

  openModal(element: HTMLElement, options:
    {
      title?: string,
      x?: number,
      y?: number,
      width?: number,
      height?: number,
      parent?: HTMLElement,
      abortSignal?: AbortSignal,
      disableResize?: boolean
    }): Promise<void>;

  createBindableObjectBrowser: () => IBindableObjectsBrowser
}