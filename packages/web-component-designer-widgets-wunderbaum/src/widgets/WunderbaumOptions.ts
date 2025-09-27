import { css } from "@node-projects/base-custom-webcomponent";
import { WunderbaumOptions } from "wb_options";
import { assetsPath } from "../Constants.js";

export const defaultStyle = css`
i.wb-icon > span.wb-badge {
  font-size: 70%;
  background-color: #486471;
}
div.wunderbaum {
  --wb-active-color-grayscale: #dddddd;
}
div.wunderbaum span.wb-node i.wb-icon {
  background-size: 12px 12px;
  background-position-x: 5px;
  background-position-y: 5px;
}
div.wunderbaum span.wb-node i.wb-expander {
  background-size: 12px 12px;
  background-position-x: 5px;
  background-position-y: 5px;
}`;

export const defaultOptions: WunderbaumOptions = {
  element: null,
  debugLevel: 0,
  scrollIntoViewOnExpandClick: false,
  //@ts-ignore
  iconMap: {
    expanderCollapsed: assetsPath + 'images/expander.svg',
    expanderExpanded: assetsPath + 'images/expanderClose.svg',
    folder: assetsPath + 'images/folder.svg',
    folderLazy: assetsPath + 'images/folder.svg',
    folderOpen: assetsPath + 'images/folder.svg',
    doc: assetsPath + 'images/file.svg',
  },
  quicksearch: true,
  checkbox: false,
  source: [],
  header: false,
  iconBadge: (e) => {
    //@ts-ignore
    const node = e.node;
    if (node.expanded || !node.children || !node.children.length) {
      return null;
    }
    return { badge: node.children.length };
  }
}