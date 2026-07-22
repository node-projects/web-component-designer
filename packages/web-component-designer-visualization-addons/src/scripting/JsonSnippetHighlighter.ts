export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Minimal JSON syntax highlighter for short code-snippet examples - not a real parser. */
export function highlightJson(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|\b(-?\d+(?:\.\d+)?)\b/g,
    (match, str, colon, keyword, num) => {
      if (str) return `<span class="${colon ? 'cs-key' : 'cs-str'}">${str}</span>${colon ?? ''}`;
      if (keyword) return `<span class="cs-bool">${keyword}</span>`;
      if (num) return `<span class="cs-num">${num}</span>`;
      return match;
    },
  );
}
