import { Fragment, type ReactNode } from "react";

const TOKENS = [
  { open: "**", close: "**", className: "font-bold text-zinc-900", strong: true },
  { open: "[[font:+1]]", close: "[[/font]]", className: "text-[1.12em]", strong: false },
  { open: "[[font:-1]]", close: "[[/font]]", className: "text-[0.9em]", strong: false },
] as const;

/** Render the small, safe formatting vocabulary stored inside test text. */
export function renderRichText(value: string, keyPrefix = "rich"): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  while (cursor < value.length) {
    let found: { at: number; token: (typeof TOKENS)[number] } | null = null;
    for (const token of TOKENS) {
      const at = value.indexOf(token.open, cursor);
      if (at >= 0 && (!found || at < found.at)) found = { at, token };
    }
    if (!found) {
      nodes.push(<Fragment key={`${keyPrefix}-text-${index++}`}>{value.slice(cursor)}</Fragment>);
      break;
    }
    if (found.at > cursor) nodes.push(<Fragment key={`${keyPrefix}-text-${index++}`}>{value.slice(cursor, found.at)}</Fragment>);
    const innerStart = found.at + found.token.open.length;
    const end = value.indexOf(found.token.close, innerStart);
    if (end < 0) {
      nodes.push(<Fragment key={`${keyPrefix}-tail-${index++}`}>{value.slice(found.at)}</Fragment>);
      break;
    }
    const children = renderRichText(value.slice(innerStart, end), `${keyPrefix}-${index}`);
    nodes.push(found.token.strong
      ? <strong key={`${keyPrefix}-fmt-${index++}`} className={found.token.className}>{children}</strong>
      : <span key={`${keyPrefix}-fmt-${index++}`} className={found.token.className}>{children}</span>);
    cursor = end + found.token.close.length;
  }
  return nodes;
}
