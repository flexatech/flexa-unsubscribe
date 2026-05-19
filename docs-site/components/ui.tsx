import type { ReactNode } from 'react';

/**
 * Presentational primitives shared by every section. Kept server-side
 * (no "use client") so they ship zero JS — only the Sidebar is
 * interactive.
 */

export function Section({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line py-14">
      {kicker && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-600">
          {kicker}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 space-y-5 text-[15px] leading-7 text-ink-soft">
        {children}
      </div>
    </section>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-base leading-7 text-ink-soft">{children}</p>;
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.8em] text-brand-700">
      {children}
    </code>
  );
}

export function CodeBlock({
  children,
  caption,
}: {
  children: ReactNode;
  caption?: string;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-line">
      {caption && (
        <figcaption className="border-b border-line bg-slate-50 px-4 py-2 text-xs font-medium text-muted">
          {caption}
        </figcaption>
      )}
      <pre className="overflow-x-auto bg-slate-900 p-4 text-[13px] leading-6 text-slate-100">
        <code className="font-mono">{children}</code>
      </pre>
    </figure>
  );
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'security';
  title: string;
  children: ReactNode;
}) {
  const map = {
    info: 'border-brand-300 bg-brand-50 text-brand-700',
    warn: 'border-amber-300 bg-amber-50 text-amber-800',
    security: 'border-rose-300 bg-rose-50 text-rose-800',
  } as const;
  return (
    <div className={`rounded-lg border-l-4 p-4 text-sm ${map[tone]}`}>
      <p className="mb-1 font-semibold">{title}</p>
      <div className="space-y-2 leading-6">{children}</div>
    </div>
  );
}

export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((cells, i) => (
            <tr key={i} className="align-top hover:bg-slate-50/60">
              {cells.map((c, j) => (
                <td key={j} className="px-4 py-3 text-ink-soft">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Method({ verb }: { verb: string }) {
  const color: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-sky-100 text-sky-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-rose-100 text-rose-700',
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-bold ${
        color[verb] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {verb}
    </span>
  );
}
