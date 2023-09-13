import { flexboxExtensionShowOverlayOptionName } from "../FlexboxExtensionProvider.js";
import { AbstractDesignViewConfigButton } from "./AbstractDesignViewConfigButton.js";

export class FlexboxExtensionDesignViewConfigButtons extends AbstractDesignViewConfigButton {
  constructor() {
    super(flexboxExtensionShowOverlayOptionName, "F", "show flexbox overlay")
  }
}