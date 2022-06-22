export enum ExtensionType {
  Permanent = 1,
  Selection = 2,
  PrimarySelection = 4,
  PrimarySelectionContainer = 8,
  MouseOver = 16,
  Placement = 17,
  OnlyOneItemSelected = 32,
  MultipleItemsSelected = 64,
  /**
   * Extension for the Container wich the dragged element is draged over.
   */
  ContainerDragOver = 128,
  /**
   * Extension for the Current Container wich the dragged element is contained.
   */
  ContainerDrag = 256,
  Doubleclick = 512,
}