/** @jest-environment jsdom */
import { expect, jest, test } from '@jest/globals';
import { ExtensionType } from '../src/elements/widgets/designerView/extensions/ExtensionType';
import { NodeType } from '../src/elements/item/NodeType';

CSSStyleSheet.prototype.replaceSync = function () {};

test('filtered reapplication reevaluates only requested items without traversing unrelated descendants', async () => {
  const { ExtensionManager } = await import('../src/elements/widgets/designerView/extensions/ExtensionManager');
  const selected = { nodeType: NodeType.Element, hasChildren: false };
  const other = { nodeType: NodeType.Element, hasChildren: false };
  const children = jest.fn(() => [selected, other]);
  const root = { nodeType: NodeType.Element, hasChildren: true, children };
  const enabled = new Set([other]);
  const created = new Map<object, { extend: ReturnType<typeof jest.fn>; dispose: ReturnType<typeof jest.fn> }>();
  const provider = {
    shouldExtend: jest.fn((_manager: unknown, _canvas: unknown, item: typeof selected) => enabled.has(item)),
    getExtension: (_manager: unknown, _canvas: unknown, item: typeof selected) => {
      const extension = { extend: jest.fn(), dispose: jest.fn() }; created.set(item, extension); return extension;
    },
  };
  const event = { on: () => ({ dispose() {} }) };
  const canvas = {
    rootDesignItem: root,
    overlayLayer: { startBatch() {}, endBatch() {} },
    instanceServiceContainer: { selectionService: { onSelectionChanged: event, onSelectionRefresh: event }, onContentChanged: event },
    serviceContainer: { globalContext: { onToolChanged: event }, designerExtensions: new Map([[ExtensionType.Selection, [provider]]]) },
  };
  const manager = new ExtensionManager(canvas as any);
  manager.applyExtension(selected as any, ExtensionType.Selection);
  manager.applyExtension(other as any, ExtensionType.Selection);
  const otherExtension = created.get(other)!;
  provider.shouldExtend.mockClear(); enabled.add(selected);

  manager.reapplyAllAppliedExtentions([selected as any]);
  expect(children).not.toHaveBeenCalled();
  expect(provider.shouldExtend).toHaveBeenCalledTimes(1);
  expect(provider.shouldExtend).toHaveBeenCalledWith(manager, canvas, selected);
  expect(created.get(selected)!.extend).toHaveBeenCalledTimes(1);
  expect(otherExtension.dispose).not.toHaveBeenCalled();

  manager.reapplyAllAppliedExtentions();
  expect(children).toHaveBeenCalledTimes(1);
  expect(otherExtension.dispose).toHaveBeenCalledTimes(1);
  manager.dispose();
});
