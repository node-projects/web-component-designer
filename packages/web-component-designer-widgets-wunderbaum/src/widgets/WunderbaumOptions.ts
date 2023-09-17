import { WunderbaumOptions } from "wb_options"

const config: WunderbaumOptions = {
    element: null,
    debugLevel: 5,
    iconMap: {
      expanderExpanded: new URL("../../assets/images/expander.svg", import.meta.url).toString(),
      expanderCollapsed: new URL("../../assets/images/expanderClose.svg", import.meta.url).toString(),
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
      const node = e.node;
      if (node.expanded || !node.children || !node.children.length) {
        return null;
      }
      return { badge: node.children.length };
    },
}
export default config;