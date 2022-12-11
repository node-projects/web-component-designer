import { IPopupService, Popup, PopupPlacement } from './IPopupService.js';

export class PopupService implements IPopupService {
  private container: Element;

  private zindex: number;;

  constructor(container: Element) {
    this.container = container;
  }

  showPopup(element: Element, popupPlacement?: PopupPlacement): Popup {
    this.container.appendChild(element);
    this.bringToFront(element);
    return { close: () => this.closePopup(element) };
  }

  public closePopup(element: Element) {
    this.container.removeChild(element);
  }

  public bringToFront(element: Element) {
    this.zindex++;
    (<HTMLElement>element).style.zIndex = <any>this.zindex;
  }
}