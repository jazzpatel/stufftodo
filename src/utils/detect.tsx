import React from "react";

// Matches common US/international phone formats
const PHONE = /(\+?1?\s?[\(\[]?\d{3}[\)\]]?[\s\-.]?\d{3}[\s\-.]?\d{4})/g;

// Matches common street address patterns
const ADDRESS =
  /(\d+\s+(?:[A-Za-z]+\s+)+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Pkwy|Parkway|Circle|Cir|Trail|Trl)\.?)(?=[,\s]|$)/gi;

type Span = { s: number; e: number; val: string; kind: "phone" | "addr" };

function extractSpans(text: string): Span[] {
  const spans: Span[] = [];
  let m: RegExpExecArray | null;
  PHONE.lastIndex = 0;
  while ((m = PHONE.exec(text)) !== null)
    spans.push({
      s: m.index,
      e: m.index + m[0].length,
      val: m[0],
      kind: "phone",
    });
  ADDRESS.lastIndex = 0;
  while ((m = ADDRESS.exec(text)) !== null) {
    if (!spans.some((x) => m!.index < x.e && m!.index + m![0].length > x.s))
      spans.push({
        s: m.index,
        e: m.index + m[0].length,
        val: m[0],
        kind: "addr",
      });
  }
  return spans.sort((a, b) => a.s - b.s);
}

export function renderLinkedText(text: string): React.ReactNode {
  const spans = extractSpans(text);
  if (!spans.length) return text;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const sp of spans) {
    if (sp.s > cursor) parts.push(text.slice(cursor, sp.s));
    if (sp.kind === "phone") {
      parts.push(
        <a
          key={sp.s}
          href={`tel:${sp.val.replace(/\D/g, "")}`}
          className="linked linked-phone"
          onClick={(e) => e.stopPropagation()}
        >
          {sp.val}
        </a>,
      );
    } else {
      const q = encodeURIComponent(sp.val);
      const href = /iPhone|iPad|iPod/.test(navigator.userAgent)
        ? `https://maps.apple.com/?q=${q}`
        : `https://www.google.com/maps/search/?api=1&query=${q}`;
      parts.push(
        <a
          key={sp.s}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="linked linked-addr"
          onClick={(e) => e.stopPropagation()}
        >
          {sp.val}
        </a>,
      );
    }
    cursor = sp.e;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
