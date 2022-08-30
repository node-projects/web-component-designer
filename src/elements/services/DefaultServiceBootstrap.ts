import { ServiceContainer } from './ServiceContainer.js';
import { PolymerPropertiesService } from './propertiesService/services/PolymerPropertiesService.js';
import { LitElementPropertiesService } from './propertiesService/services/LitElementPropertiesService.js';
import { NativeElementsPropertiesService } from './propertiesService/services/NativeElementsPropertiesService.js';
import { DefaultInstanceService } from './instanceService/DefaultInstanceService.js';
import { DefaultEditorTypesService } from './propertiesService/DefaultEditorTypesService.js';
import { BaseCustomWebComponentPropertiesService } from './propertiesService/services/BaseCustomWebComponentPropertiesService.js';
import { DefaultPlacementService } from './placementService/DefaultPlacementService.js';
import { DefaultHtmlParserService } from './htmlParserService/DefaultHtmlParserService.js';
import { Lit2PropertiesService } from './propertiesService/services/Lit2PropertiesService.js';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType.js';
import { ElementDragTitleExtensionProvider } from '../widgets/designerView/extensions/ElementDragTitleExtensionProvider.js';
import { GridExtensionProvider } from '../widgets/designerView/extensions/GridExtensionProvider.js';
import { TransformOriginExtensionProvider } from '../widgets/designerView/extensions/TransformOriginExtensionProvider.js';
import { CanvasExtensionProvider } from '../widgets/designerView/extensions/CanvasExtensionProvider.js';
import { PositionExtensionProvider } from '../widgets/designerView/extensions/PositionExtensionProvider.js';
import { PathExtensionProvider } from '../widgets/designerView/extensions/PathExtensionProvider.js';
import { MouseOverExtensionProvider } from '../widgets/designerView/extensions/MouseOverExtensionProvider.js';
import { NamedTools } from '../widgets/designerView/tools/NamedTools.js';
import { PointerTool } from '../widgets/designerView/tools/PointerTool.js';
import { DrawPathTool } from '../widgets/designerView/tools/DrawPathTool.js';
import { SelectionDefaultExtensionProvider } from '../widgets/designerView/extensions/SelectionDefaultExtensionProvider.js';
import { ResizeExtensionProvider } from '../widgets/designerView/extensions/ResizeExtensionProvider.js';
import { RotateExtensionProvider } from '../widgets/designerView/extensions/RotateExtensionProvider.js';
import { ZoomTool } from '../widgets/designerView/tools/ZoomTool.js';
import { PanTool } from '../widgets/designerView/tools/PanTool.js';
import { CopyPasteContextMenu } from '../widgets/designerView/extensions/contextMenu/CopyPasteContextMenu.js';
import { ZMoveContextMenu } from '../widgets/designerView/extensions/contextMenu/ZMoveContextMenu.js';
import { MultipleItemsSelectedContextMenu } from '../widgets/designerView/extensions/contextMenu/MultipleItemsSelectedContextMenu.js';
import { RectangleSelectorTool } from '../widgets/designerView/tools/RectangleSelectorTool.js';
import { MagicWandSelectorTool } from '../widgets/designerView/tools/MagicWandSelectorTool.js';
import { PickColorTool } from '../widgets/designerView/tools/PickColorTool.js';
import { TextTool } from '../widgets/designerView/tools/TextTool.js';
import { GrayOutExtensionProvider } from '../widgets/designerView/extensions/GrayOutExtensionProvider.js';
import { AltToEnterContainerExtensionProvider } from '../widgets/designerView/extensions/AltToEnterContainerExtensionProvider.js';
import { InvisibleDivExtensionProvider } from '../widgets/designerView/extensions/InvisibleDivExtensionProvider.js';
import { ItemsBelowContextMenu } from '../widgets/designerView/extensions/contextMenu/ItemsBelowContextMenu.js';
import { GridPlacementService } from './placementService/GridPlacementService.js';
import { ElementAtPointService } from './elementAtPointService/ElementAtPointService';
import { FlexBoxPlacementService } from './placementService/FlexBoxPlacementService';
import { SnaplinesProviderService } from './placementService/SnaplinesProviderService';
import { DragDropService } from './dragDropService/DragDropService';
import { EditTextExtensionProvider } from '../widgets/designerView/extensions/EditText/EditTextExtensionProvider.js';
import { CopyPasteService } from './copyPasteService/CopyPasteService';
import { DefaultModelCommandService } from './modelCommandService/DefaultModelCommandService';
import { ButtonSeperatorProvider } from '../widgets/designerView/ButtonSeperatorProvider';
import { GridExtensionDesignViewConfigButtons } from '../widgets/designerView/extensions/GridExtensionDesignViewConfigButtons';
import { DemoProviderService } from './demoProviderService/DemoProviderService';
//import { CursorLinePointerExtensionProvider } from '../widgets/designerView/extensions/pointerExtensions/CursorLinePointerExtensionProvider.js';
import { DrawRectTool } from '../widgets/designerView/tools/DrawRectTool.js';
import { DrawEllipsisTool } from '../widgets/designerView/tools/DrawEllipsisTool.js';
import { DrawLineTool } from '../widgets/designerView/tools/DrawLineTool.js';
import { HtmlWriterService } from './htmlWriterService/HtmlWriterService.js';
import { RectContextMenu } from '../widgets/designerView/extensions/contextMenu/RectContextMenu.js';
import { PathContextMenu } from '../widgets/designerView/extensions/contextMenu/PathContextMenu.js';
import { SeperatorContextMenu } from '../widgets/designerView/extensions/contextMenu/SeperatorContextMenu.js';
import { ZoomToElementContextMenu } from '../widgets/designerView/extensions/contextMenu/ZoomToElementContextMenu.js';
import { RotateLeftAndRight } from '../widgets/designerView/extensions/contextMenu/RotateLeftAndRightContextMenu.js';
import { SelectAllChildrenContextMenu } from '../widgets/designerView/extensions/contextMenu/SelectAllChildrenContextMenu';
import { PointerToolButtonProvider } from '../widgets/designerView/tools/toolBar/buttons/PointerToolButtonProvider.js';
import { SeperatorToolProvider } from '../widgets/designerView/tools/toolBar/buttons/SeperatorToolProvider.js';
import { ZoomToolButtonProvider } from '../widgets/designerView/tools/toolBar/buttons/ZoomToolButtonProvider.js';
import { DrawToolButtonProvider } from '../widgets/designerView/tools/toolBar/buttons/DrawToolButtonProvider.js';
import { TextToolButtonProvider } from '../widgets/designerView/tools/toolBar/buttons/TextToolButtonProvider.js';
import { SelectorToolButtonProvider } from '../widgets/designerView/tools/toolBar/buttons/SelectorToolButtonProvider.js';
import { GrayOutDragOverContainerExtensionProvider } from '../widgets/designerView/extensions/GrayOutDragOverContainerExtensionProvider.js';
import { PlacementExtensionProvider } from '../widgets/designerView/extensions/PlacementExtensionProvider.js';

export function createDefaultServiceContainer() {
  let serviceContainer = new ServiceContainer();

  serviceContainer.register("propertyService", new PolymerPropertiesService());
  serviceContainer.register("propertyService", new LitElementPropertiesService());
  serviceContainer.register("propertyService", new NativeElementsPropertiesService());
  serviceContainer.register("propertyService", new Lit2PropertiesService());
  serviceContainer.register("propertyService", new BaseCustomWebComponentPropertiesService());
  serviceContainer.register("instanceService", new DefaultInstanceService());
  serviceContainer.register("editorTypesService", new DefaultEditorTypesService());
  serviceContainer.register("htmlWriterService", new HtmlWriterService());
  serviceContainer.register("containerService", new DefaultPlacementService());
  serviceContainer.register("containerService", new GridPlacementService());
  serviceContainer.register("containerService", new FlexBoxPlacementService());
  serviceContainer.register("snaplinesProviderService", new SnaplinesProviderService());
  serviceContainer.register("htmlParserService", new DefaultHtmlParserService());
  serviceContainer.register("elementAtPointService", new ElementAtPointService());
  serviceContainer.register("dragDropService", new DragDropService());
  serviceContainer.register("copyPasteService", new CopyPasteService());
  serviceContainer.register("modelCommandService", new DefaultModelCommandService());
  serviceContainer.register("demoProviderService", new DemoProviderService());

  serviceContainer.designerExtensions.set(ExtensionType.Permanent, [
    // new ResizeExtensionProvider(false),
    new InvisibleDivExtensionProvider(),
    // new ElementDragTitleExtensionProvider(),
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.PrimarySelection, [
    new ElementDragTitleExtensionProvider(),
    new GridExtensionProvider(),
    new TransformOriginExtensionProvider(),
    new CanvasExtensionProvider(),
    new PositionExtensionProvider(),
    new PathExtensionProvider(),
    new ResizeExtensionProvider(true),
    new RotateExtensionProvider(),
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.Selection, [
    new SelectionDefaultExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.PrimarySelectionContainer, [
    new GridExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.MouseOver, [
    new MouseOverExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.Placement, [
    new PlacementExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.ContainerDrag, [
    new GrayOutExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.ContainerDragOver, [
    new GrayOutDragOverContainerExtensionProvider(),
    new AltToEnterContainerExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.ContainerExternalDragOver, [
    new GrayOutDragOverContainerExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.Doubleclick, [
    new EditTextExtensionProvider()
  ]);

  serviceContainer.designerTools.set(NamedTools.Pointer, new PointerTool());
  serviceContainer.designerTools.set(NamedTools.DrawSelection, new RectangleSelectorTool());
  serviceContainer.designerTools.set(NamedTools.DrawPath, new DrawPathTool());
  serviceContainer.designerTools.set(NamedTools.DrawRect, new DrawRectTool());
  serviceContainer.designerTools.set(NamedTools.DrawEllipsis, new DrawEllipsisTool());
  serviceContainer.designerTools.set(NamedTools.DrawLine, new DrawLineTool());
  serviceContainer.designerTools.set(NamedTools.Zoom, new ZoomTool());
  serviceContainer.designerTools.set(NamedTools.Pan, new PanTool());
  serviceContainer.designerTools.set(NamedTools.RectangleSelector, new RectangleSelectorTool());
  serviceContainer.designerTools.set(NamedTools.MagicWandSelector, new MagicWandSelectorTool());
  serviceContainer.designerTools.set(NamedTools.PickColor, new PickColorTool());
  serviceContainer.designerTools.set(NamedTools.Text, new TextTool());

  serviceContainer.designerPointerExtensions.push(
    //new CursorLinePointerExtensionProvider()
  );

  serviceContainer.designViewConfigButtons.push(
    new ButtonSeperatorProvider(20),
    new GridExtensionDesignViewConfigButtons()
  );

  serviceContainer.designViewToolbarButtons.push(
    new PointerToolButtonProvider(),
    new SeperatorToolProvider(22),
    new SelectorToolButtonProvider(),
    new SeperatorToolProvider(22),
    new ZoomToolButtonProvider(),
    new SeperatorToolProvider(22),
    new DrawToolButtonProvider(),
    new SeperatorToolProvider(5),
    new TextToolButtonProvider()
  );

  serviceContainer.designerContextMenuExtensions = [
    new CopyPasteContextMenu(),
    new SeperatorContextMenu(),
    new RotateLeftAndRight(),
    new SeperatorContextMenu(),
    new ZoomToElementContextMenu(),
    new SeperatorContextMenu(),
    new ZMoveContextMenu(),
    new MultipleItemsSelectedContextMenu(),
    new PathContextMenu(),
    new RectContextMenu(),
    new SeperatorContextMenu(),
    new SelectAllChildrenContextMenu(),
    new SeperatorContextMenu(),
    new ItemsBelowContextMenu(),
  ];

  return serviceContainer;
}

export default createDefaultServiceContainer;