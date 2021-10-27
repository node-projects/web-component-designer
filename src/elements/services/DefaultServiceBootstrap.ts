import { ServiceContainer } from './ServiceContainer.js';
import { PolymerPropertiesService } from './propertiesService/services/PolymerPropertiesService.js';
import { LitElementPropertiesService } from './propertiesService/services/LitElementPropertiesService.js';
import { NativeElementsPropertiesService } from './propertiesService/services/NativeElementsPropertiesService.js';
import { DefaultInstanceService } from './instanceService/DefaultInstanceService.js';
import { DefaultEditorTypesService } from './propertiesService/DefaultEditorTypesService.js';
import { HtmlWriterService } from './htmlWriterService/HtmlWriterService.js';
import { BaseCustomWebComponentPropertiesService } from './propertiesService/services/BaseCustomWebComponentPropertiesService.js';
import { DefaultPlacementService } from './placementService/DefaultPlacementService.js';
import { DefaultHtmlParserService } from './htmlParserService/DefaultHtmlParserService.js';
import { Lit2PropertiesService } from './propertiesService/services/Lit2PropertiesService.js';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType.js';
import { PrimarySelectionDefaultExtensionProvider } from '../widgets/designerView/extensions/PrimarySelectionDefaultExtensionProvider.js';
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
//import { PolymerBindingsService } from './bindingsService/PolymerBindingsService.js';
import { ItemsBelowContextMenu } from '../widgets/designerView/extensions/contextMenu/ItemsBelowContextMenu.js';
import { GridPlacementService } from './placementService/GridPlacementService.js';
import { ElementAtPointService } from './elementAtPointService/ElementAtPointService';
import { FlexBoxPlacementService } from './placementService/FlexBoxPlacementService';
import { SnaplinesProviderService } from './placementService/SnaplinesProviderService';
import { PrepareElementsForDesignerService } from './instanceService/PrepareElementsForDesignerService';
import { DragDropService } from './dragDropService/DragDropService';
import { EditTextExtensionProvider } from '../widgets/designerView/extensions/EditText/EditTextExtensionProvider.js';
import { BaseCustomeWebcomponentBindingsService } from './bindingsService/BaseCustomeWebcomponentBindingsService';

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
  serviceContainer.register("bindingService", new BaseCustomeWebcomponentBindingsService());
  serviceContainer.register("elementAtPointService", new ElementAtPointService());
  serviceContainer.register("prepareElementsForDesignerService", new PrepareElementsForDesignerService());
  serviceContainer.register("dragDropService", new DragDropService());

  serviceContainer.designerExtensions.set(ExtensionType.Permanent, [
    new ResizeExtensionProvider(false),
    new InvisibleDivExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.PrimarySelection, [
    new PrimarySelectionDefaultExtensionProvider(),
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
  serviceContainer.designerExtensions.set(ExtensionType.ContainerDrag, [
    new GrayOutExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.ContainerDragOver, [
    new AltToEnterContainerExtensionProvider()
  ]);
  serviceContainer.designerExtensions.set(ExtensionType.Doubleclick, [
    new EditTextExtensionProvider()
  ]);

  serviceContainer.designerTools.set(NamedTools.Pointer, new PointerTool());
  serviceContainer.designerTools.set(NamedTools.DrawSelection, new RectangleSelectorTool());
  serviceContainer.designerTools.set(NamedTools.DrawPath, new DrawPathTool());
  serviceContainer.designerTools.set(NamedTools.Zoom, new ZoomTool());
  serviceContainer.designerTools.set(NamedTools.Pan, new PanTool());
  serviceContainer.designerTools.set(NamedTools.RectangleSelector, new RectangleSelectorTool());
  serviceContainer.designerTools.set(NamedTools.MagicWandSelector, new MagicWandSelectorTool());
  serviceContainer.designerTools.set(NamedTools.PickColor, new PickColorTool());
  serviceContainer.designerTools.set(NamedTools.Text, new TextTool());

  serviceContainer.designerContextMenuExtensions = [
    new CopyPasteContextMenu(),
    new ZMoveContextMenu(),
    new MultipleItemsSelectedContextMenu(),
    new ItemsBelowContextMenu()
  ];

  return serviceContainer;
}

export default createDefaultServiceContainer;