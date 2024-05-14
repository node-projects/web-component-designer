export interface IContextMenu {
	close: () => void;
};

export interface IContextMenuItem {
	readonly id?: string,
	readonly title?: string,
	readonly icon?: string,
	readonly children?: IContextMenuItem[],
	readonly disabled?: boolean,
	readonly shortCut?: string;
  readonly checked?: boolean;

	action?: (event: MouseEvent, item: IContextMenuItem, context?: any, menu?: IContextMenu) => void
};