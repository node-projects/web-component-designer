import { css } from "@node-projects/base-custom-webcomponent";
import { WunderbaumOptions } from "wb_options";

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
    expanderCollapsed: new URL("../../assets/images/expander.svg", import.meta.url).toString(),
    expanderExpanded: new URL("../../assets/images/expanderClose.svg", import.meta.url).toString(),
    folder: new URL("../../assets/images/folder.svg", import.meta.url).toString(),
    folderLazy: new URL("../../assets/images/folder.svg", import.meta.url).toString(),
    folderOpen: new URL("../../assets/images/folder.svg", import.meta.url).toString(),
    doc: new URL("../../assets/images/file.svg", import.meta.url).toString(),
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