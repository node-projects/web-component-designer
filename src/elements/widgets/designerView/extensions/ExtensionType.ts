export enum ExtensionType {
  Permanent = 1,
  Selection = 2,
  PrimarySelection = 3,
  PrimarySelectionContainer = 4,
  MouseOver = 5,
  OnlyOneItemSelected = 6,
  MultipleItemsSelected = 7,
  /**
   * Extension for the Container wich the dragged element is draged over.
   */
  ContainerDragOver = 8,
   /**
   * Extension for the Container on wich a new element is draged over.
   */
  ContainerExternalDragOver = 9,
  /**
   * Extension for the Current Container wich the dragged element is contained.
   */
  ContainerDrag = 10,
  Doubleclick = 11,
  Placement = 12,
  TransformOrigin = 13
}