import { IDesignItem } from '../../item/IDesignItem';
import { IIntializationService } from './IIntializationService';

export class DefaultIntializationService implements IIntializationService {
  init(designItem: IDesignItem) {
    if (designItem.name == 'iframe') {
      this.initializeIframe(<HTMLIFrameElement>designItem.element);
    }
  }

  initializeIframe(iframe: HTMLIFrameElement) {
    iframe.contentDocument.body.style.pointerEvents = 'none';
    function cloneIframeEvent(event: PointerEvent) {
      var clRect = iframe.getBoundingClientRect();
      let data = { ...event };
      data.clientX = event.clientX + clRect.left;
      data.clientY = event.clientY + clRect.top;
      var evt = new PointerEvent(event.type, data) //new CustomEvent('pointerdown', {bubbles: true, cancelable: false});
      iframe.dispatchEvent(evt);
    }
    iframe.contentWindow.addEventListener('pointerdown', cloneIframeEvent);
    iframe.contentWindow.addEventListener('pointermove', cloneIframeEvent);
    iframe.contentWindow.addEventListener('pointerup', cloneIframeEvent);
  };
}