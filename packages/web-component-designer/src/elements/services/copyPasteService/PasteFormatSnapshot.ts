import { PropertiesHelper } from "../propertiesService/services/PropertiesHelper.js";

export const pasteFormatKinds = ['all', 'border', 'background', 'text'] as const;

export type PasteFormatKind = typeof pasteFormatKinds[number];

export interface IPasteFormatEntry {
  readonly name: string;
  readonly value: string;
}

export interface IPasteFormatSnapshot {
  readonly all: readonly IPasteFormatEntry[];
  readonly border: readonly IPasteFormatEntry[];
  readonly background: readonly IPasteFormatEntry[];
  readonly text: readonly IPasteFormatEntry[];
}

type StyleArrayLike = Pick<CSSStyleDeclaration, 'getPropertyValue' | 'length'> & ArrayLike<string>;
type StyleEntries = Iterable<[name: string, value: string]>;

const explicitTextProperties = new Set([
  'color',
  'caret-color',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'white-space',
  'word-break',
  'overflow-wrap',
  'hyphens',
  'tab-size',
  'direction',
  'writing-mode',
  'unicode-bidi'
]);

function isBorderProperty(name: string): boolean {
  return name.startsWith('border');
}

function isBackgroundProperty(name: string): boolean {
  return name.startsWith('background');
}

function isTextProperty(name: string): boolean {
  return name.startsWith('font')
    || name.startsWith('text')
    || explicitTextProperties.has(name);
}

function collectEntries(style: StyleArrayLike, predicate: (name: string) => boolean): IPasteFormatEntry[] {
  const entries: IPasteFormatEntry[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < style.length; index++) {
    const name = PropertiesHelper.camelToDashCase(style[index]);
    if (!name || seen.has(name) || !predicate(name)) {
      continue;
    }

    const value = style.getPropertyValue(name)?.trim();
    if (!value) {
      continue;
    }

    seen.add(name);
    entries.push({ name, value });
  }

  return entries;
}

function createPasteFormatSnapshotFromNormalizedEntries(entries: IPasteFormatEntry[]): IPasteFormatSnapshot {
  const border = entries.filter(x => isBorderProperty(x.name));
  const background = entries.filter(x => isBackgroundProperty(x.name));
  const text = entries.filter(x => isTextProperty(x.name));

  const all: IPasteFormatEntry[] = [];
  const seen = new Set<string>();

  for (const group of [border, background, text]) {
    for (const entry of group) {
      if (seen.has(entry.name)) {
        continue;
      }

      seen.add(entry.name);
      all.push(entry);
    }
  }

  return { all, border, background, text };
}

export function createPasteFormatSnapshot(style: StyleArrayLike): IPasteFormatSnapshot {
  const entries = collectEntries(style, () => true);
  return createPasteFormatSnapshotFromNormalizedEntries(entries);
}

export function createPasteFormatSnapshotFromEntries(entries: StyleEntries): IPasteFormatSnapshot | null {
  const normalizedEntries: IPasteFormatEntry[] = [];
  const seen = new Set<string>();

  for (const [rawName, rawValue] of entries) {
    const name = rawName?.trim().toLowerCase();
    const value = rawValue?.trim();
    if (!name || !value || seen.has(name)) {
      continue;
    }

    seen.add(name);
    normalizedEntries.push({ name, value });
  }

  if (!normalizedEntries.length) {
    return null;
  }

  return createPasteFormatSnapshotFromNormalizedEntries(normalizedEntries);
}

export function getPasteFormatEntries(snapshot: IPasteFormatSnapshot, kind: PasteFormatKind): readonly IPasteFormatEntry[] {
  return snapshot[kind];
}