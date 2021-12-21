import { DomHelper } from '@node-projects/base-custom-webcomponent';
import { IRect } from '../../../interfaces/IRect.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { ISnaplinesProviderService } from './ISnaplinesProviderService.js';

export class SnaplinesProviderService implements ISnaplinesProviderService {
  provideSnaplines(containerItem: IDesignItem, ignoredItems: IDesignItem[]) {
    {
      const canvas = containerItem.instanceServiceContainer.designerCanvas;
      const ignMap = new Map<Element, IDesignItem>(ignoredItems.map(i => [i.element, i]));
      const outerRect = containerItem.element.getBoundingClientRect();

      const positionsH: [number, IRect][] = [];
      const positionsMiddleH: [number, IRect][] = [];
      const positionsV: [number, IRect][] = [];
      const positionsMiddleV: [number, IRect][] = [];

      let ignoreElements = ignoredItems.map(x => x.element);
      for (let n of DomHelper.getAllChildNodes(containerItem.element, false, ignoreElements)) {
        if (!ignMap.has(<Element>n)) {
          const p = (<Element>n).getBoundingClientRect();
          const pLeft = (p.x - outerRect.x) / canvas.scaleFactor;
          const pMidH = (p.x - outerRect.x + p.width / 2) / canvas.scaleFactor;
          const pRight = (p.x - outerRect.x + p.width) / canvas.scaleFactor;
          const pTop = (p.y - outerRect.y) / canvas.scaleFactor;
          const pMidV = (p.y - outerRect.y + p.height / 2) / canvas.scaleFactor;
          const pBottom = (p.y - outerRect.y + p.height) / canvas.scaleFactor;
          const transformedP: IRect = { x: pLeft + outerRect.x, y: pTop + outerRect.y, width: p.width / canvas.scaleFactor, height: p.height / canvas.scaleFactor };
          
          positionsH.push([pLeft, transformedP])
          positionsMiddleH.push([pMidH, transformedP])
          positionsH.push([pRight, transformedP])

          positionsV.push([pTop, transformedP])
          positionsMiddleV.push([pMidV, transformedP])
          positionsV.push([pBottom, transformedP])
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