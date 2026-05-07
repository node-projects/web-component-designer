export type SvgPathHandleType = 'anchor' | 'cp1' | 'cp2';

export interface ISvgPathHandleRange {
  segmentIndex: number;
  handleType: SvgPathHandleType;
  start: number;
  length: number;
}

interface NumberToken {
  value: number;
  start: number;
  end: number;
}

type PathToken = NumberToken | { command: string; start: number; end: number };

const parameterCount: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

function isCommandToken(token: PathToken): token is { command: string; start: number; end: number } {
  return 'command' in token;
}

function isNumberToken(token: PathToken): token is NumberToken {
  return 'value' in token;
}

function tokenizePathData(value: string): PathToken[] {
  const tokens: PathToken[] = [];
  const tokenRegex = /[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:(?:\d*\.\d+)|(?:\d+\.?))(?:[eE][-+]?\d+)?/g;
  let match: RegExpExecArray;

  while ((match = tokenRegex.exec(value))) {
    const token = match[0];
    if (/^[AaCcHhLlMmQqSsTtVvZz]$/.test(token))
      tokens.push({ command: token, start: match.index, end: match.index + token.length });
    else
      tokens.push({ value: Number(token), start: match.index, end: match.index + token.length });
  }

  return tokens;
}

function getRange(numbers: NumberToken[], indexes: number[]): { start: number; length: number } {
  const selected = indexes.map(index => numbers[index]).filter(x => x);
  const start = Math.min(...selected.map(x => x.start));
  const end = Math.max(...selected.map(x => x.end));
  return { start, length: end - start };
}

function addHandleRange(ranges: ISvgPathHandleRange[], segmentIndex: number, handleType: SvgPathHandleType, numbers: NumberToken[], indexes: number[]) {
  const range = getRange(numbers, indexes);
  ranges.push({ segmentIndex, handleType, start: range.start, length: range.length });
}

function addSegmentRanges(ranges: ISvgPathHandleRange[], command: string, segmentIndex: number, numbers: NumberToken[]) {
  switch (command.toUpperCase()) {
    case 'M':
    case 'L':
    case 'T':
      addHandleRange(ranges, segmentIndex, 'anchor', numbers, [0, 1]);
      break;
    case 'H':
    case 'V':
      addHandleRange(ranges, segmentIndex, 'anchor', numbers, [0]);
      break;
    case 'C':
      addHandleRange(ranges, segmentIndex, 'cp1', numbers, [0, 1]);
      addHandleRange(ranges, segmentIndex, 'cp2', numbers, [2, 3]);
      addHandleRange(ranges, segmentIndex, 'anchor', numbers, [4, 5]);
      break;
    case 'S':
      addHandleRange(ranges, segmentIndex, 'cp2', numbers, [0, 1]);
      addHandleRange(ranges, segmentIndex, 'anchor', numbers, [2, 3]);
      break;
    case 'Q':
      addHandleRange(ranges, segmentIndex, 'cp1', numbers, [0, 1]);
      addHandleRange(ranges, segmentIndex, 'anchor', numbers, [2, 3]);
      break;
    case 'A':
      addHandleRange(ranges, segmentIndex, 'anchor', numbers, [5, 6]);
      break;
  }
}

export function parseSvgPathDataSourceMap(value: string): ISvgPathHandleRange[] {
  const tokens = tokenizePathData(value);
  const ranges: ISvgPathHandleRange[] = [];
  let index = 0;
  let command: string = null;
  let segmentIndex = 0;

  while (index < tokens.length) {
    const token = tokens[index];
    if (isCommandToken(token)) {
      command = token.command;
      index++;

      if (command.toUpperCase() === 'Z') {
        segmentIndex++;
        continue;
      }
    } else if (!command) {
      index++;
      continue;
    }

    let effectiveCommand = command;
    let parameters = parameterCount[effectiveCommand.toUpperCase()];
    if (parameters == null || parameters === 0)
      continue;

    let firstMoveSegment = effectiveCommand.toUpperCase() === 'M';
    while (index < tokens.length && !isCommandToken(tokens[index])) {
      if (firstMoveSegment) {
        effectiveCommand = command;
        firstMoveSegment = false;
      } else if (command.toUpperCase() === 'M') {
        effectiveCommand = command === command.toLowerCase() ? 'l' : 'L';
      }

      parameters = parameterCount[effectiveCommand.toUpperCase()];
      const numbers: NumberToken[] = [];
      for (let parameterIndex = 0; parameterIndex < parameters && index < tokens.length; parameterIndex++, index++) {
        const numberToken = tokens[index];
        if (!isNumberToken(numberToken))
          break;
        numbers.push(numberToken);
      }

      if (numbers.length !== parameters)
        break;

      addSegmentRanges(ranges, effectiveCommand, segmentIndex, numbers);
      segmentIndex++;
    }
  }

  return ranges;
}
