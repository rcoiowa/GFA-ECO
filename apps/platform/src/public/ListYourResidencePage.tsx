import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { createMyResidence, ensureMyPerson } from '@recoveryos/data-access';
import { Alert, Button, Card, TextField } from '@recoveryos/ui';

const PAGE_PATH = '/recovery-residences/list-your-residence';

const FEATURES = [
  'Real-time bed availability & waitlist queue',
  'Applications with a 2-business-day response workflow',
  'Resident daily life: check-ins, chores, curfew, passes',
  'Program fee tracking, receipts & balances',
  'Grievance workflow with response deadlines',
  'House-wide announcements & community board',
  'NARR 3.0 and Iowa HHS compliance trackers',
];

const COMMITMENTS = [
  'MAT/MOUD-affirming',
  'Trauma-informed',
  'Multiple pathways',
  'NARR-aligned',
  'Faith-welcoming',
  'Pet-friendly',
  'Reentry-supportive',
  'Phase-based',
];

const ORG_STRUCTURES = [
  ['nonprofit_501c3', '501(c)(3) Nonprofit'],
  ['llc_private', 'LLC / Private Operator'],
  ['faith_based', 'Faith-Based Organization'],
  ['government', 'Government / County'],
  ['other', 'Other'],
] as const;

const LEVELS = [
  ['I', 'Level I — Peer-Run'],
  ['II', 'Level II — Monitored'],
  ['III', 'Level III — Supervised'],
  ['IV', 'Level IV — Service Provider'],
] as const;

const CURFEWS = ['9:00 PM', '10:00 PM', '11:00 PM', 'Midnight'];

/**
 * Universal platform front door for operators: every recovery house gets
 * the same operations workspace Grace House runs on. Three-step wizard
 * (organization → residence → house standards) from the Recovery Residence
 * platform prototype; submitting provisions the residence and makes the
 * signed-in person its residence_manager.
 */
export function ListYourResidencePage() {
  const { session, person, refreshIdentity } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [org, setOrg] = useState({
    name: '',
    structure: 'nonprofit_501c3' as (typeof ORG_STRUCTURES)[number][0],
    phone: '',
    email: '',
    contactFirstName: '',
    contactLastName: '',
  });
  const [res, setRes] = useState({
    name: '',
    population: 'Women',
    capacity: '',
    weeklyFee: '',
    level: 'II' as (typeof LEVELS)[number][0],
    city: '',
    state: 'IA',
  });
  const [commitments, setCommitments] = useState<string[]>([
    'MAT/MOUD-affirming',
    'Trauma-informed',
  ]);
  const [curfew, setCurfew] = useState('10:00 PM');

  function toggleCommitment(c: string) {
    setCommitments((current) =>
      current.includes(c) ? current.filter((x) => x !== c) : [...current, c],
    );
  }

  function nextFromOrg(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!org.name.trim()) {
      setFormError('Please tell us your organization name.');
      return;
    }
    setStep(1);
  }

  function nextFromResidence(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!res.name.trim() || !res.capacity.trim()) {
      setFormError('Residence name and bed capacity are required.');
      return;
    }
    setStep(2);
  }

  async function launch(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      if (!person) {
        await ensureMyPerson({
          firstName: org.contactFirstName.trim() || 'Operator',
          lastName: org.contactLastName.trim() || org.name.trim(),
        });
        await refreshIdentity();
      }
      await createMyResidence({
        orgName: org.name,
        orgStructure: org.structure,
        orgPhone: org.phone || undefined,
        orgEmail: org.email || undefined,
        residenceName: res.name,
        populationServed: res.population,
        capacity: Number(res.capacity) || 0,
        weeklyFee: res.weeklyFee ? Number(res.weeklyFee) : undefined,
        levelOfSupport: res.level,
        city: res.city || undefined,
        state: res.state || undefined,
        commitments,
        curfewWeeknight: curfew,
      });
      navigate('/staff/today');
    } catch {
      setFormError(
        "We couldn't launch your residence just now. Nothing is lost — please try again, or email gracehouse@graceforaddictions.org for a hand.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold text-experience-700">
            VRCC
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/recovery-residences"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Residence
            </Link>
            {!session ? (
              <Link
                to="/sign-in"
                state={{ from: PAGE_PATH }}
                className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
              >
                Sign in
              </Link>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
          <Link to="/recovery-residences" className="hover:text-experience-700 hover:underline">
            Recovery residences
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page" className="text-ink">
            List your residence
          </span>
        </nav>

        <h1 className="text-3xl font-semibold text-ink">
          Every recovery house deserves great operations
        </h1>
        <p className="mt-2 text-lg text-ink-muted">
          Create a residence profile and get the full operations workspace — beds, waitlists,
          applications, check-ins, fees, grievances, and messaging — built on trauma-informed,
          MAT/MOUD-affirming practice standards. Free for recovery housing operators.
        </p>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="rounded-md border border-line bg-surface-raised px-3 py-2 text-sm text-ink"
            >
              {f}
            </li>
          ))}
        </ul>

        {!session ? (
          <Card className="mt-8">
            <p className="text-ink">
              Creating a residence profile takes about five minutes and starts with a free account,
              so your workspace belongs to you from day one.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate(`/register?next=${encodeURIComponent(PAGE_PATH)}`)}
              >
                Create my account
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/sign-in', { state: { from: PAGE_PATH } })}
              >
                I already have an account
              </Button>
            </div>
          </Card>
        ) : (
          <div className="mt-8">
            <ol className="flex gap-2 text-sm" aria-label="Steps">
              {['Your organization', 'The residence', 'House standards'].map((label, i) => (
                <li
                  key={label}
                  aria-current={step === i ? 'step' : undefined}
                  className={`rounded-full px-3 py-1 ${
                    step === i
                      ? 'bg-experience-600 text-white'
                      : step > i
                        ? 'bg-experience-soft text-experience-700'
                        : 'bg-surface-sunken text-ink-muted'
                  }`}
                >
                  {i + 1}. {label}
                </li>
              ))}
            </ol>

            {formError ? (
              <div className="mt-4">
                <Alert tone="critical">{formError}</Alert>
              </div>
            ) : null}

            {step === 0 ? (
              <form onSubmit={nextFromOrg} className="mt-5 flex flex-col gap-4" noValidate>
                <p className="text-ink-muted">
                  Tell us about the business or nonprofit operating this residence.
                </p>
                <TextField
                  label="Organization name"
                  required
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                />
                <label className="flex flex-col gap-1.5 font-medium text-ink">
                  Org type
                  <select
                    value={org.structure}
                    onChange={(e) =>
                      setOrg({ ...org, structure: e.target.value as typeof org.structure })
                    }
                    className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base font-normal text-ink"
                  >
                    {ORG_STRUCTURES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {!person ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Your first name"
                      value={org.contactFirstName}
                      onChange={(e) => setOrg({ ...org, contactFirstName: e.target.value })}
                    />
                    <TextField
                      label="Your last name"
                      value={org.contactLastName}
                      onChange={(e) => setOrg({ ...org, contactLastName: e.target.value })}
                    />
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Contact phone"
                    type="tel"
                    value={org.phone}
                    onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  />
                  <TextField
                    label="Contact email"
                    type="email"
                    value={org.email}
                    onChange={(e) => setOrg({ ...org, email: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit">Next →</Button>
                </div>
              </form>
            ) : step === 1 ? (
              <form onSubmit={nextFromResidence} className="mt-5 flex flex-col gap-4" noValidate>
                <p className="text-ink-muted">
                  Each profile manages one house. You can add more houses later.
                </p>
                <TextField
                  label="Residence name"
                  required
                  value={res.name}
                  onChange={(e) => setRes({ ...res, name: e.target.value })}
                />
                <label className="flex flex-col gap-1.5 font-medium text-ink">
                  Population served
                  <select
                    value={res.population}
                    onChange={(e) => setRes({ ...res, population: e.target.value })}
                    className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base font-normal text-ink"
                  >
                    {[
                      'Men',
                      'Women',
                      'All genders',
                      'Women & children',
                      'Veterans',
                      'Young adults (18–25)',
                    ].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Bed capacity"
                    type="number"
                    min={1}
                    required
                    value={res.capacity}
                    onChange={(e) => setRes({ ...res, capacity: e.target.value })}
                  />
                  <TextField
                    label="Weekly fee ($)"
                    type="number"
                    min={0}
                    value={res.weeklyFee}
                    onChange={(e) => setRes({ ...res, weeklyFee: e.target.value })}
                  />
                </div>
                <label className="flex flex-col gap-1.5 font-medium text-ink">
                  Level of support
                  <select
                    value={res.level}
                    onChange={(e) => setRes({ ...res, level: e.target.value as typeof res.level })}
                    className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base font-normal text-ink"
                  >
                    {LEVELS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="City"
                    value={res.city}
                    onChange={(e) => setRes({ ...res, city: e.target.value })}
                  />
                  <TextField
                    label="State"
                    value={res.state}
                    onChange={(e) => setRes({ ...res, state: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                    ← Back
                  </Button>
                  <Button type="submit">Next →</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={launch} className="mt-5 flex flex-col gap-4" noValidate>
                <p className="text-ink-muted">
                  Select the commitments this residence operates under. These display to residents
                  and referral partners.
                </p>
                <fieldset>
                  <legend className="font-medium text-ink">Practice commitments</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {COMMITMENTS.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-ink">
                        <input
                          type="checkbox"
                          checked={commitments.includes(c)}
                          onChange={() => toggleCommitment(c)}
                          className="size-4"
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="flex flex-col gap-1.5 font-medium text-ink">
                  Curfew (weeknights)
                  <select
                    value={curfew}
                    onChange={(e) => setCurfew(e.target.value)}
                    className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base font-normal text-ink"
                  >
                    {CURFEWS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Launching your residence…' : 'Launch residence ✓'}
                  </Button>
                </div>
                <p className="text-sm text-ink-muted">
                  Launching opens your operations workspace immediately — beds, applications,
                  waitlist, and the rest. You can refine everything later.
                </p>
              </form>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · Recovery Residence platform · Trauma-informed · MAT/MOUD-affirming
        </p>
      </footer>
    </div>
  );
}
