import React from 'react';

/* Renders "[TODO: Dani — ...]" markers visibly (secondary ink, italic, never
   link-styled) so nothing placeholder can ship silently (site-v1.md §4). */
export function TodoText({ text }: { text: string }) {
  const parts = text.split(/(\[TODO:[^\]]*\])/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('[TODO:') ? (
          <span key={i} className="todo">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

function todoize(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (c) =>
    typeof c === 'string' ? <TodoText text={c} /> : c,
  );
}

function P({ children }: { children?: React.ReactNode }) {
  return <p>{todoize(children)}</p>;
}

export function Warning({ children }: { children?: React.ReactNode }) {
  return (
    <div className="warning">
      <span className="label">Warning</span>
      {todoize(children)}
    </div>
  );
}

export function Note({ children }: { children?: React.ReactNode }) {
  return (
    <div className="note">
      <span className="label">Note</span>
      {todoize(children)}
    </div>
  );
}

export function Fig({
  n,
  caption,
  children,
}: {
  n: number;
  caption: string;
  children?: React.ReactNode;
}) {
  return (
    <figure>
      {children}
      <figcaption>
        <span className="label">Fig. {n}</span>
        {caption}
      </figcaption>
    </figure>
  );
}

export function Data({
  n,
  caption,
  children,
}: {
  n: number;
  caption: string;
  children?: React.ReactNode;
}) {
  return (
    <figure>
      <div className="table-scroll">
        <table>{children}</table>
      </div>
      <figcaption>
        <span className="label">Table {n}</span>
        {caption}
      </figcaption>
    </figure>
  );
}

export const mdxComponents = { p: P, Warning, Note, Fig, Data };
