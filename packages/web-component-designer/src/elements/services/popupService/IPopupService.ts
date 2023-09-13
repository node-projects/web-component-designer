export type PlacementType = 'automatic' | 'relativeTo';

export type PopupPlacement = {
  placementType: PlacementType;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
};

export type Popup = {
  close: () => void
}
export interface IPopupService {
  showPopup(element: Element, popupPlacement?: PopupPlacement): Popup;
}