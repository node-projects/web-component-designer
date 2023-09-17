import { WunderbaumOptions } from "wb_options"

const config: WunderbaumOptions = {
    element: null,
    debugLevel: 5,
    iconMap: {
      expanderExpanded: new URL("../../assets/images/folder.svg", import.meta.url).toString(),
      expanderCollapsed: new URL("../../assets/images/folderClose.svg", import.meta.url).toString(),
    },
    quicksearch: true,
    checkbox: false,
    source: [],
    header: false,
}
export default config;