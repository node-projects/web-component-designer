export interface IContextMenuItem {
	readonly title?: string,
	readonly icon?: string,
	readonly children?: IContextMenuItem[],
	readonly disabled?: boolean,
	readonly shortCut?: string;

	action?: (event: MouseEvent, item: IContextMenuItem) => void
};