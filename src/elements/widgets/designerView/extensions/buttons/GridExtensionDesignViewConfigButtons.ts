import { gridExtensionShowOverlayOptionName } from "../GridExtensionProvider.js";
import { AbstractDesignViewConfigButton } from "./AbstractDesignViewConfigButton.js";

export class GridExtensionDesignViewConfigButtons extends AbstractDesignViewConfigButton {
  constructor() {
    super(gridExtensionShowOverlayOptionName, "G", "show grid overlay")
  }
}