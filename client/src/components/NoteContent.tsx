import type { ReactNode } from "react";

/**
 * Renders session/roll notes with lightweight Markdown or Org formatting.
 * Output is built as React elements (never innerHTML), so note text is XSS-safe.
 */

type Format = "markdown" | "org";

/**
 * Heuristic: Org links ([[...]]), #+ directives, and multi-star headings are
 * unambiguous Org signals. A lone "* " line is ambiguous (Markdown bullet) and
 * does not flip the format on its own.
 */
function detectFormat(text: string): Format {
  if (
    /\[\[[^\]]+\]\]/.test(text) ||
    /^#\+\w/m.test(text) ||
    /^\*{2,}\s+\S/m.test(text)
  ) {
    return "org";
  }
  return "markdown";
}

function safeHref(url: string): string | undefined {
  return /^https?:\/\//i.test(url) ? url : undefined;
}

function renderLink(href: string, label: ReactNode, key: number): ReactNode {
  const url = safeHref(href);
  if (!url) return <span key={key}>{label}</span>;
  return (
    <a key={key} href={url} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

interface InlineRule {
  re: RegExp;
  render: (
    m: RegExpMatchArray,
    inner: (s: string) => ReactNode[],
    key: number
  ) => ReactNode;
}

const MD_RULES: InlineRule[] = [
  { re: /`([^`]+)`/, render: (m, _i, k) => <code key={k}>{m[1]}</code> },
  {
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    render: (m, inner, k) => renderLink(m[2], inner(m[1]), k),
  },
  {
    re: /https?:\/\/[^\s<>()]+/,
    render: (m, _i, k) => renderLink(m[0], m[0], k),
  },
  {
    re: /\*\*([^*]+)\*\*/,
    render: (m, inner, k) => <strong key={k}>{inner(m[1])}</strong>,
  },
  {
    re: /\*([^*\s][^*]*)\*/,
    render: (m, inner, k) => <em key={k}>{inner(m[1])}</em>,
  },
  {
    re: /_([^_]+)_/,
    render: (m, inner, k) => <em key={k}>{inner(m[1])}</em>,
  },
];

const ORG_RULES: InlineRule[] = [
  {
    re: /\[\[([^\][]+)\](?:\[([^\][]+)\])?\]/,
    render: (m, inner, k) => renderLink(m[1], m[2] ? inner(m[2]) : m[1], k),
  },
  {
    re: /https?:\/\/[^\s<>()]+/,
    render: (m, _i, k) => renderLink(m[0], m[0], k),
  },
  { re: /~([^~\n]+)~/, render: (m, _i, k) => <code key={k}>{m[1]}</code> },
  { re: /=([^=\n]+)=/, render: (m, _i, k) => <code key={k}>{m[1]}</code> },
  {
    re: /\*([^*\s][^*\n]*)\*/,
    render: (m, inner, k) => <strong key={k}>{inner(m[1])}</strong>,
  },
  {
    re: /\/([^/\s][^/\n]*)\//,
    render: (m, inner, k) => <em key={k}>{inner(m[1])}</em>,
  },
];

/** Replaces the earliest-matching rule repeatedly; rule order breaks ties. */
function renderInline(text: string, rules: InlineRule[]): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    let hit: { idx: number; m: RegExpMatchArray; rule: InlineRule } | null =
      null;
    for (const rule of rules) {
      const m = rest.match(rule.re);
      if (m && m.index !== undefined && (hit === null || m.index < hit.idx)) {
        hit = { idx: m.index, m, rule };
      }
    }
    if (!hit) {
      out.push(rest);
      break;
    }
    if (hit.idx > 0) out.push(rest.slice(0, hit.idx));
    out.push(hit.rule.render(hit.m, (s) => renderInline(s, rules), key++));
    rest = rest.slice(hit.idx + hit.m[0].length);
  }
  return out;
}

function heading(level: number, content: ReactNode[], key: number): ReactNode {
  // Notes render inside pages that already use h2/h3, so clamp to h4–h6.
  const Tag = `h${Math.min(level + 3, 6)}` as "h4" | "h5" | "h6";
  return <Tag key={key}>{content}</Tag>;
}

function paragraph(
  lines: string[],
  rules: InlineRule[],
  key: number
): ReactNode {
  const parts: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) parts.push(<br key={`br-${i}`} />);
    parts.push(...renderInline(line, rules));
  });
  return <p key={key}>{parts}</p>;
}

function parseBlocks(text: string, fmt: Format): ReactNode[] {
  const rules = fmt === "org" ? ORG_RULES : MD_RULES;
  const headingRe = fmt === "org" ? /^(\*+)\s+(.*)$/ : /^(#{1,6})\s+(.*)$/;
  const bulletRe = fmt === "org" ? /^\s*[-+]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
  const orderedRe = /^\s*\d+[.)]\s+(.*)$/;

  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let key = 0;

  const flush = () => {
    if (para.length > 0) {
      blocks.push(paragraph(para, rules, key++));
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      flush();
      continue;
    }

    // Fenced / src code blocks.
    const isFence =
      fmt === "org" ? /^#\+BEGIN_SRC\b/i.test(line) : /^```/.test(line);
    if (isFence) {
      flush();
      const endRe = fmt === "org" ? /^#\+END_SRC\b/i : /^```/;
      const code: string[] = [];
      i++;
      while (i < lines.length && !endRe.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      blocks.push(
        <pre key={key++}>
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Other Org directives (#+TITLE: etc.) are metadata, not content.
    if (fmt === "org" && /^#\+/.test(line)) {
      flush();
      continue;
    }

    const h = line.match(headingRe);
    if (h) {
      flush();
      blocks.push(heading(h[1].length, renderInline(h[2], rules), key++));
      continue;
    }

    const isBullet = (l: string) => bulletRe.test(l) && !headingRe.test(l);
    if (isBullet(line) || orderedRe.test(line)) {
      flush();
      const ordered = !isBullet(line);
      const itemRe = ordered ? orderedRe : bulletRe;
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const m = lines[i].match(itemRe);
        if (!m || (!ordered && !isBullet(lines[i]))) break;
        items.push(<li key={items.length}>{renderInline(m[1], rules)}</li>);
        i++;
      }
      i--;
      blocks.push(
        ordered ? <ol key={key++}>{items}</ol> : <ul key={key++}>{items}</ul>
      );
      continue;
    }

    if (fmt === "markdown" && /^>\s?/.test(line)) {
      flush();
      const quoted: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      i--;
      blocks.push(
        <blockquote key={key++}>{paragraph(quoted, rules, 0)}</blockquote>
      );
      continue;
    }

    para.push(line);
  }
  flush();
  return blocks;
}

export default function NoteContent({ text }: { text: string }) {
  return <div className="prose">{parseBlocks(text, detectFormat(text))}</div>;
}
