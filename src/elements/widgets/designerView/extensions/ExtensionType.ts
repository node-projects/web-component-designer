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
  ContainerDragOverAndCanBeEntered = 8,
   /**
   * Extension for the Container on wich a new element is draged over.
   */
  ContainerExternalDragOverAndCanBeEntered = 9,
  /**
   * Extension for the Current Container wich the dragged element is contained.
   */
  ContainerDrag = 10,
  Doubleclick = 11,
  Placement = 12,

  /**
   * Extensions only when the container can be Entered.
   * So for Example on a custome webcomponent wich uses a grid layout for it's root, but can not show children,
   * do not display grid extension.
   */
  PrimarySelectionAndCanBeEntered = 13,
  PrimarySelectionContainerAndCanBeEntered = 14,
}