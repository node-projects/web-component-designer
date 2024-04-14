import { basicStackedToolbarExtensionOverlayOptionName } from "../BasicStackedToolbarExtension.js";
import { AbstractDesignViewConfigButton } from "./AbstractDesignViewConfigButton.js";

export class ToolbarExtensionsDesignViewConfigButtons extends AbstractDesignViewConfigButton {
  constructor() {
    super(basicStackedToolbarExtensionOverlayOptionName, "T", "show Toolbars")
  }
}