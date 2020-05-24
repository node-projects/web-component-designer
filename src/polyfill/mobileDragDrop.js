// see https://github.com/timruffles/mobile-drag-drop/issues/115
function tryFindDraggableTarget(event) {
  const cp = event.composedPath();
  for (const o of cp) {
      let el = o;
      do {
          if (el.draggable === false) {
              continue;
          }
          if (el.getAttribute && el.getAttribute('draggable') === 'true') {
              return el;
          }
      } while ((el = el.parentNode) && el !== document.body);
  }
}

function elementFromPoint(x, y) {
  let el = document.elementFromPoint(x, y);
  if (el) {
      // walk down custom component shadowRoots'
      while (el.shadowRoot) {
          let customEl = el.shadowRoot.elementFromPoint(x, y);
          // I'm a ShadowDom noob, can the element returned ever be the custom element itself?
          if (customEl === null || customEl === el) {
              break;
          }
          el = customEl;
      }
      return el;
  }
}

MobileDragDrop.polyfill({ tryFindDraggableTarget: tryFindDraggableTarget, elementFromPoint: elementFromPoint });
