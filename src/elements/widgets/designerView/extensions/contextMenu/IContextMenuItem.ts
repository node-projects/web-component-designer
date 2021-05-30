export interface IContextMenuItem {
  title: string;
  icon?: string;
  action?: () => void;
  children ?: IContextMenuItem[];
}