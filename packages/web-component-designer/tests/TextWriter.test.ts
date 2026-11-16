import { expect, test } from '@jest/globals';
import { IndentedTextWriter } from '../src/elements/helper/IndentedTextWriter';
import { SimpleTextWriter } from '../src/elements/helper/SimpleTextWriter';

for (const Writer of [IndentedTextWriter, SimpleTextWriter]) test(`${Writer.name} preserves text, positions and newline state across empty and fragmented writes`, () => {
  const writer = new Writer();
  expect(writer.position).toBe(0); expect(writer.isLastCharNewline()).toBe(false);
  writer.write('first\n'); writer.write('');
  expect(writer.isLastCharNewline()).toBe(true);
  writer.write('second'); expect(writer.isLastCharNewline()).toBe(false);
  writer.write('\n'); writer.writeIndent();
  expect(writer.isLastCharNewline()).toBe(true);
  writer.levelRaise(); writer.writeIndent(); writer.write('third'); writer.levelShrink();
  const expected = `first\nsecond\n${Writer === IndentedTextWriter ? '    ' : ''}third`;
  expect(writer.position).toBe(expected.length); expect(writer.getString()).toBe(expected);
  for (let index = 0; index < 2000; index++) {
    writer.write('<div>item</div>'); expect(writer.isLastCharNewline()).toBe(false);
  }
  expect(writer.getString()).toBe(expected + '<div>item</div>'.repeat(2000));
  writer.writeLine('end');
  expect(writer.isLastCharNewline()).toBe(Writer === IndentedTextWriter);
});
