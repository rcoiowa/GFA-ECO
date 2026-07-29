import type { ReactNode } from 'react';
import { Link } from 'react-router';

export interface Crumb {
  to: string;
  label: string;
}

/**
 * Every page answers: Where am I? How did I get here? What should I do next?
 * `crumbs` renders the trail back home; `action` is the page's next step.
 */
export function PageHeader({
  title,
  lede,
  crumbs,
  action,
}: {
  title: string;
  lede?: string;
  crumbs?: Crumb[];
  action?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {crumbs && crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            {crumbs.map((c) => (
              <li key={c.to} className="flex items-center gap-1.5">
                <Link to={c.to} className="hover:text-experience-700 underline-offset-2 hover:underline">
                  {c.label}
                </Link>
                <span aria-hidden>/</span>
              </li>
            ))}
            <li aria-current="page" className="text-ink">
              {title}
            </li>
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          {lede ? <p className="mt-1 max-w-prose text-ink-muted">{lede}</p> : null}
        </div>
        {action}
      </div>
    </header>
  );
}
