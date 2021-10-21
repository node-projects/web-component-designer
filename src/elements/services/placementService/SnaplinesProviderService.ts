import { DomHelper } from '@node-projects/base-custom-webcomponent';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { ISnaplinesProviderService } from './ISnaplinesProviderService.js';

export class SnaplinesProviderService implements ISnaplinesProviderService {
  provideSnaplines(containerItem: IDesignItem, ignoredItems: IDesignItem[]) {
    {
      const ignMap = new Map<Element, IDesignItem>(ignoredItems.map(i => [i.element, i]));
      const outerRect = containerItem.element.getBoundingClientRect();

      const positionsH: [number, DOMRect][] = [];
      const positionsMiddleH: [number, DOMRect][] = [];
      const positionsV: [number, DOMRect][] = [];
      const positionsMiddleV: [number, DOMRect][] = [];

      let ignoreElements = ignoredItems.map(x => x.element);
      for (let n of DomHelper.getAllChildNodes(containerItem.element, false, ignoreElements)) {
        if (!ignMap.has(<Element>n)) {
          let p = (<Element>n).getBoundingClientRect();

          let pLeft = p.x - outerRect.x;
          let pMidH = p.x - outerRect.x + p.width / 2;
          let pRight = p.x - outerRect.x + p.width;
          positionsH.push([pLeft, p])
          positionsMiddleH.push([pMidH, p])
          positionsH.push([pRight, p])


          let pTop = p.y - outerRect.y;
          let pMidV = p.y - outerRect.y + p.height / 2;
          let pBottom = p.y - outerRect.y + p.height;
          positionsV.push([pTop, p])
          positionsMiddleV.push([pMidV, p])
          positionsV.push([pBottom, p])
        }
      }
      positionsH.sort((a, b) => a[0] - b[0]);
      positionsMiddleH.sort((a, b) => a[0] - b[0]);
      positionsV.sort((a, b) => a[0] - b[0]);
      positionsMiddleV.sort((a, b) => a[0] - b[0]);

      return { outerRect, positionsH, positionsMiddleH, positionsV, positionsMiddleV }
    }
  }


}