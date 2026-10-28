/** Lowercase + strip Vietnamese diacritics so "huyen" matches "Huyền". */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** Every whitespace-separated word of `query` appears in `haystack` (both folded). */
export function matchesAllWords(haystack: string, query: string): boolean {
  const words = foldText(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = foldText(haystack);
  return words.every((word) => text.includes(word));
}
