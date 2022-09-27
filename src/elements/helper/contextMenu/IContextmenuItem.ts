export interface IContextMenuItem {
  readonly title: string;
  readonly icon?: string;
  readonly action?: (e: HTMLElement, args?: Event) => void 
  readonly children ?: IContextMenuItem[];
  readonly shortCut?: string;
}