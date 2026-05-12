export function splitCssImportant(value: string): { value: string, important: boolean } {
  const match = value.match(/\s*!\s*important\s*$/i);
  if (!match)
    return { value, important: false };

  return { value: value.substring(0, match.index).trimEnd(), important: true };
}

export function appendCssImportant(value: string, important: boolean) {
  if (!important)
    return value;

  return value + ' !important';
}
