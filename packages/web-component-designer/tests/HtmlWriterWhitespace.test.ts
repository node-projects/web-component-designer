/**
 * @jest-environment jsdom
 */
import { beforeAll, expect, test } from '@jest/globals';
import { HtmlWriterService } from '../src/elements/services/htmlWriterService/HtmlWriterService';
import { FormatingHtmlWriterService } from '../src/elements/services/htmlWriterService/FormatingHtmlWriterService';
import { IHtmlWriterService } from '../src/elements/services/htmlWriterService/IHtmlWriterService';
import { IndentedTextWriter } from '../src/elements/helper/IndentedTextWriter';
import { IDesignItem } from '../src/elements/item/IDesignItem';

beforeAll(() => {
  // JSDOM does not provide the MathML constructor used by display detection.
  if (!window.MathMLElement)
    Object.defineProperty(window, 'MathMLElement', { value: class MathMLElement extends Element {}, configurable: true });
});

function createDesignItem(node: Node, parent: IDesignItem = null): IDesignItem {
  const element = node instanceof HTMLElement ? node : null;
  const attributes = element ? Array.from(element.attributes).filter(a => a.name !== 'style').map(a => [a.name, a.value]) : [];
  const styles = element ? Array.from(element.style).map(name => [name, element.style.getPropertyValue(name)]) : [];
  const children: IDesignItem[] = [];
  const item = {
    nodeType: node.nodeType,
    name: element?.localName,
    element: node,
    window,
    parent,
    content: node.textContent,
    hasContent: !!node.textContent,
    hasAttributes: attributes.length > 0,
    attributes: () => attributes,
    hasStyles: styles.length > 0,
    styles: () => styles,
    isStyleImportant: (name: string) => element.style.getPropertyPriority(name) === 'important',
    hasChildren: node.hasChildNodes(),
    childCount: node.childNodes.length,
    get firstChild() { return children[0]; },
    children: () => children,
    instanceServiceContainer: {
      designItemDocumentPositionService: { setPosition() { } }
    }
  } as unknown as IDesignItem;
  children.push(...Array.from(node.childNodes).map(child => createDesignItem(child, item)));
  return item;
}

function serialize(html: string, service: IHtmlWriterService = new HtmlWriterService({ compressCssToShorthandProperties: false })) {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const writer = new IndentedTextWriter();
    service.write(writer, Array.from(container.childNodes).map(node => createDesignItem(node)), true);
    return writer.getString();
  } finally {
    container.remove();
  }
}

test.each(['block', 'flow-root', 'inline-block'])('preserves a partially decorated button with display: %s', display => {
  const html = `<button style="display:${display};width:80px;height:30px;position:absolute;left:237px;top:165px;">B<span style="text-decoration-line:overline;">utto</span>n</button>`;
  const output = serialize(html);

  expect(output.trim()).toBe(html);
  const parsed = document.createElement('div');
  parsed.innerHTML = output;
  expect(parsed.firstElementChild.textContent).toBe('Button');
  expect(parsed.querySelector('span').style.textDecorationLine).toBe('overline');
  expect(serialize(output)).toBe(output);
});

test('preserves spaces around nested inline formatting in block text', () => {
  const html = '<p>A <span style="display:inline;"><b style="display:inline;">formatted</b></span> word</p>';
  expect(serialize(html)).toBe(html + '\n');
});

test('keeps indentation between block elements containing formatted text', () => {
  const html = '<div><p>B<span>utto</span>n</p><p>Next</p></div>';
  expect(serialize(html)).toBe('<div>\n    <p>B<span>utto</span>n</p>\n    <p>Next</p>\n</div>\n');
});

for (const Writer of [HtmlWriterService, FormatingHtmlWriterService]) {
  test.each([
    '<pre>  first\n\tsecond  </pre>',
    '<pre>  first <span>  second\n\tthird </span>  </pre>',
    '<pre>  <div>first</div>\n\t<div>second</div>  </pre>',
    '<pre><span>first</span> <span>second</span></pre>',
    '<pre>  \n\t </pre>',
    '<pre>first<!-- comment -->\n  <span>second</span></pre>',
    '<div style="white-space:pre;">  first\n\tsecond  </div>',
    '<div style="white-space:pre-wrap;">  <div>first</div>\n\t<div>second</div>  </div>',
    '<div style="white-space:break-spaces;"><span>first</span>  <span>second</span></div>',
    '<div style="white-space:pre-line;">first\n<span>second\nthird</span></div>'
  ])(`${Writer.name} preserves preformatted content: %s`, html => {
    const service = new Writer({ compressCssToShorthandProperties: false });
    const output = serialize(html, service);
    expect(output.trimEnd()).toBe(html);
    expect(serialize(output, service)).toBe(output);
  });

  test(`${Writer.name} respects white-space from stylesheets`, () => {
    const style = document.createElement('style');
    style.textContent = '.preformatted { white-space: pre; }';
    document.head.appendChild(style);
    try {
      const html = '<div class="preformatted">  <span>first\n  second</span>  </div>';
      expect(serialize(html, new Writer()).trimEnd()).toBe(html);
    } finally {
      style.remove();
    }
  });
}

test('formats blocks surrounding preformatted content', () => {
  const html = '<div><pre>  first\n\t<span>second</span>  </pre><p>Next</p></div>';
  expect(serialize(html)).toBe('<div>\n    <pre>  first\n\t<span>second</span>  </pre>\n    <p>Next</p>\n</div>\n');
});
