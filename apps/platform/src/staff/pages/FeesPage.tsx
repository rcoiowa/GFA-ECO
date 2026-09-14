import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  addFeeEntry,
  feeBalance,
  listFeeLedger,
  listResidenceRoster,
  type RosterEntry,
} from '@recoveryos/data-access';
import type { FeeLedgerEntry } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  TextField,
} from '@recoveryos/ui';
import { useStaff } from '../staffContext';

const ENTRY_TYPES: FeeLedgerEntry['entry_type'][] = ['charge', 'payment', 'adjustment', 'refund'];

/**
 * Fee ledger (Policy GH-FEES-001): receipts for every payment, hardship
 * plans never punitive, and the resident can see everything here from
 * their own portal.
 */
export function FeesPage() {
  const { person } = useAuth();
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [residencyId, setResidencyId] = useState('');
  const [ledger, setLedger] = useState<FeeLedgerEntry[]>([]);
  const [entryType, setEntryType] = useState<FeeLedgerEntry['entry_type']>('payment');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRoster = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const r = await listResidenceRoster(residence.id);
      setRoster(r);
      setResidencyId((cur) => cur || String(r[0]?.id ?? ''));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  const loadLedger = useCallback(async () => {
    if (!residencyId) {
      setLedger([]);
      return;
    }
    try {
      setLedger(await listFeeLedger(Number(residencyId)));
    } catch {
      setError(true);
    }
  }, [residencyId]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);
  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const balance = useMemo(() => feeBalance(ledger), [ledger]);
  const selected = roster.find((r) => String(r.id) === residencyId);

  const submit = async () => {
    if (!person || !residencyId || !amount) return;
    setSaving(true);
    try {
      await addFeeEntry({
        residencyId: Number(residencyId),
        entryType,
        amount: Number(amount),
        method: method || undefined,
        note: note || undefined,
        recordedByPersonId: person.id,
      });
      setAmount('');
      setMethod('');
      setNote('');
      await loadLedger();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to manage fees.</Alert>;

  return (
    <>
      <PageHeader
        title="Fees"
        lede="Every payment gets a receipt; hardship plans are always available and never punitive (GH-FEES-001)."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void loadRoster()} />
      ) : roster.length === 0 ? (
        <Alert tone="attention">No active residents yet.</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Resident
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={residencyId}
                  onChange={(e) => setResidencyId(e.target.value)}
                >
                  {roster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.person.preferred_name || r.person.first_name} {r.person.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-right">
                <p className="text-sm text-ink-muted">Current balance</p>
                <p
                  className={`text-2xl font-semibold ${balance > 0 ? 'text-attention-700' : 'text-positive-700'}`}
                >
                  ${Math.abs(balance).toFixed(2)}{' '}
                  {balance > 0 ? 'owed' : balance < 0 ? 'credit' : ''}
                </p>
              </div>
            </div>
            {balance > 0 && selected ? (
              <p className="mt-2 text-sm text-ink-faint">
                If payment is hard right now, the policy asks for a conversation before the due date
                — a payment plan, never a penalty. Review begins only after 7 days without an
                approved plan.
              </p>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Record an entry</CardTitle>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Type
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as FeeLedgerEntry['entry_type'])}
                >
                  {ENTRY_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <TextField
                label="Amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <TextField
                label="Method"
                placeholder="cash / money order / transfer"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              />
              <TextField
                label="Note / receipt #"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button className="mt-3" onClick={() => void submit()} disabled={saving || !amount}>
              {saving ? 'Recording…' : 'Record entry'}
            </Button>
          </Card>

          <Card>
            <CardTitle>Ledger</CardTitle>
            {ledger.length === 0 ? (
              <p className="text-ink-muted">No entries yet for this resident.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {ledger.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap justify-between gap-2 border-b border-line py-1.5 text-sm"
                  >
                    <span className="text-ink">
                      {e.entry_type}
                      {e.method ? ` · ${e.method}` : ''}
                      {e.note ? ` · ${e.note}` : ''}
                    </span>
                    <span className={e.entry_type === 'charge' ? 'text-ink' : 'text-positive-700'}>
                      {e.entry_type === 'charge' ? '+' : '−'}${Number(e.amount).toFixed(2)}
                      <span className="ml-2 text-ink-muted">
                        {new Date(e.created_at).toLocaleDateString()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
