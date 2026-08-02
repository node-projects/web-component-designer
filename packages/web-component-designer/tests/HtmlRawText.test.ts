/**
 * @jest-environment jsdom
 */
import { expect, test } from '@jest/globals';
import { DomConverter } from '../src/elements/widgets/designerView/DomConverter';
import { HtmlWriterService } from '../src/elements/services/htmlWriterService/HtmlWriterService';
import { IndentedTextWriter } from '../src/elements/helper/IndentedTextWriter';
import { NodeType } from '../src/elements/item/NodeType';
import { IDesignItem } from '../src/elements/item/IDesignItem';

test('normalizes ordinary text but preserves raw script and style text', () => {
  const content = '`<svg>${value}</svg>` && "&"';

  expect(DomConverter.normalizeContentValue(content)).toBe('`&lt;svg>${value}&lt;/svg>` &amp;&amp; "&amp;"');
  expect(DomConverter.normalizeContentValue(content, 'script')).toBe(content);
  expect(DomConverter.normalizeContentValue(content, 'style')).toBe(content);
});

test('writes script text containing markup without escaping or truncating it', () => {
  const content = '\nconst icon = `<svg><text>${value}</text></svg>`;\n';
  const element = document.createElement('script');
  element.textContent = content;

  const textDesignItem = {
    nodeType: NodeType.TextNode,
    content
  } as unknown as IDesignItem;
  const scriptDesignItem = {
    nodeType: NodeType.Element,
    name: 'script',
    element,
    window,
    parent: null,
    hasAttributes: false,
    hasStyles: false,
    hasChildren: true,
    childCount: 1,
    firstChild: textDesignItem,
    content,
    instanceServiceContainer: {
      designItemDocumentPositionService: { setPosition() { } }
    },
    children: function* () { yield textDesignItem; }
  } as unknown as IDesignItem;
  (<any>textDesignItem).parent = scriptDesignItem;

  const writer = new IndentedTextWriter();
  new HtmlWriterService().write(writer, [scriptDesignItem], true);

  expect(writer.getString()).toBe(`<script>${content}</script>\n`);
});
