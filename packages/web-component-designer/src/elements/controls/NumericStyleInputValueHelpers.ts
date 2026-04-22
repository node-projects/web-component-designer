export type ParsedNumericStyleInputValue =
  | { kind: 'empty' }
  | { kind: 'numeric', numberText: string, value: number, unit: string }
  | { kind: 'text', text: string };

export function parseNumericStyleInputValue(value?: string | null): ParsedNumericStyleInputValue {
  const text = value?.trim() ?? '';
  if (!text)
    return { kind: 'empty' };

  const match = text.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:([a-z%]+))?$/i);
  if (!match)
    return { kind: 'text', text };

  const numericValue = Number(match[1]);
  if (Number.isNaN(numericValue))
    return { kind: 'text', text };

  return {
    kind: 'numeric',
    numberText: match[1],
    value: numericValue,
    unit: match[2]?.toLowerCase() ?? ''
  };
}

export function formatNumericStyleInputNumber(value: number, maxDecimalPlaces: number = 4): string {
  if (!Number.isFinite(value))
    return '0';
  const factor = 10 ** Math.max(0, maxDecimalPlaces);
  const roundedValue = Math.round(value * factor) / factor;
  return Object.is(roundedValue, -0) ? '0' : `${roundedValue}`;
}

export function combineNumericStyleInputValue(numberText: string, unit: string): string {
  const trimmedNumberText = numberText?.trim() ?? '';
  if (!trimmedNumberText)
    return '';
  return trimmedNumberText + (unit ?? '');
}

export function getNumericStyleInputUnitLabel(unit: string): string {
  return unit === '' ? ' ' : unit;
}

export function normalizeNumericStyleInputOptionValues(values?: string[]): string[] {
  const normalizedValues = (values ?? [])
    .map(x => x == null ? null : x.trim())
    .filter((x): x is string => x != null);
  return [...new Set(normalizedValues)];
}

export function resolveNumericStyleInputSelectedUnit(parsedUnit: string | undefined, lastNumericUnit: string | undefined, units: string[]): string | null {
  if (parsedUnit != null && units.includes(parsedUnit))
    return parsedUnit;
  return lastNumericUnit ?? units[0] ?? null;
}

export function resolveNumericStyleInputStep(unitSteps: Record<string, number> | undefined, defaultStep: number, unit?: string): number {
  if (unit != null) {
    const unitStep = unitSteps?.[unit];
    if (Number.isFinite(unitStep) && unitStep > 0)
      return unitStep;
  }
  return defaultStep;
}