import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { GFA_RESIDENCES, IOWA_LISTINGS, type ResidenceListing } from './residenceListings';

/**
 * Public recovery-housing directory — the "Residence" front door. Grace For
 * Addictions residences come first with a direct path into their application
 * flow; the statewide list helps every visitor find a bed somewhere, not
 * just with us ("referred elsewhere is a service, not a rejection").
 */
export function ResidenceDirectoryPage() {
  const [query, setQuery] = useState('');
  const [county, setCounty] = useState('all');
  const [population, setPopulation] = useState('all');

  const counties = useMemo(() => [...new Set(IOWA_LISTINGS.map((l) => l.county))].sort(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IOWA_LISTINGS.filter((l) => {
      if (county !== 'all' && l.county !== county) return false;
      if (population !== 'all') {
        const pop = l.population.toLowerCase();
        if (population === 'women' && !pop.includes('women') && !pop.includes('all')) return false;
        if (population === 'men' && !pop.includes('men') && !pop.includes('all')) return false;
      }
      if (!q) return true;
      return [l.name, l.org, l.city, l.county, l.type, l.description]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [query, county, population]);

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold text-experience-700">
            VRCC
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Center
            </Link>
            <Link
              to="/sign-in"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
          <Link to="/" className="hover:text-experience-700 underline underline-offset-2">
            Home
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page" className="text-ink">
            Recovery residences
          </span>
        </nav>

        <h1 className="text-3xl font-semibold text-ink">Recovery housing options</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-muted">
          Safe, substance-free homes for people building recovery. Start with a Grace For Addictions
          residence and apply today, or search recovery housing across Iowa.
        </p>

        <section aria-labelledby="gfa-residences" className="mt-10">
          <h2 id="gfa-residences" className="text-xl font-semibold text-ink">
            Grace For Addictions residences
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {GFA_RESIDENCES.map((r) => (
              <li
                key={r.name}
                className="flex min-w-0 flex-col rounded-lg border border-line bg-surface-raised p-5"
              >
                <h3 className="text-lg font-semibold text-ink">{r.name}</h3>
                <p className="text-sm text-ink-muted">
                  {r.city}, Iowa · {r.population} · {r.type}
                </p>
                <p className="mt-2 flex-1 text-ink-muted">{r.description}</p>
                <p className="mt-2 break-words text-sm text-ink-muted">{r.contact}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {r.applyUrl ? (
                    <a
                      href={r.applyUrl}
                      className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
                    >
                      Visit {r.name} &amp; apply
                    </a>
                  ) : null}
                  {r.profilePath ? (
                    <Link
                      to={r.profilePath}
                      className="inline-flex min-h-11 items-center font-medium text-experience-700 underline underline-offset-2"
                    >
                      About {r.name}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="iowa-directory" className="mt-12">
          <h2 id="iowa-directory" className="text-xl font-semibold text-ink">
            Recovery housing across Iowa
          </h2>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Compiled from public sources; inclusion is not an endorsement and details change —
            always verify directly with the residence.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="flex flex-col text-sm font-medium text-ink">
              Search
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, city, or program"
                className="mt-1 min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-ink">
              County
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="mt-1 min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
              >
                <option value="all">All counties</option>
                {counties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-ink">
              Who it serves
              <select
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
                className="mt-1 min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
              >
                <option value="all">Everyone</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-ink-muted">
              No matches — try clearing a filter, or call 515-220-8771 and we&rsquo;ll help you find
              a fit.
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {filtered.map((l: ResidenceListing) => (
                <li key={l.name} className="rounded-lg border border-line bg-surface-raised p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-ink">{l.name}</h3>
                    <p className="text-sm text-ink-muted">
                      {l.city} · {l.county} County · {l.population}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{l.type}</p>
                  <p className="mt-1 text-ink-muted">{l.description}</p>
                  <p className="mt-1 text-sm text-ink">{l.contact}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="operators"
          className="mt-12 rounded-lg border border-line bg-surface-raised p-6"
        >
          <h2 id="operators" className="text-xl font-semibold text-ink">
            Run a recovery house?
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Every recovery house deserves great operations. Create a residence profile and get bed
            management, waitlists, applications, check-ins, fees, and grievance workflows — free.
          </p>
          <Link
            to="/recovery-residences/list-your-residence"
            className="mt-4 inline-flex min-h-11 items-center rounded-md border border-experience-600 px-5 font-semibold text-experience-700 hover:bg-surface-sunken"
          >
            List your residence
          </Link>
        </section>

        <section className="mt-6 rounded-lg bg-experience-soft p-6">
          <h2 className="text-xl font-semibold text-experience-700">Not sure where to start?</h2>
          <p className="mt-2 max-w-2xl text-ink">
            The VRCC is free for everyone — housed or not. A resource navigator can help you sort
            options, make calls, and land somewhere safe.
          </p>
          <Link
            to="/register"
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
          >
            Join the VRCC free
          </Link>
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · Connection prevents crisis · In immediate danger, call 911. For
          crisis support, call or text 988.
        </p>
      </footer>
    </div>
  );
}
