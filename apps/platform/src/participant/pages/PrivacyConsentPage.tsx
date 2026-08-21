import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  listActiveConsentTypes,
  listMyConsentGrants,
  recordConsentDecision,
} from '@recoveryos/data-access';
import type { ConsentGrant, ConsentType } from '@recoveryos/domain';
import { Alert, Button, Card, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';

/**
 * Granular, revocable consent. The latest grant per consent type is the
 * current decision; history is append-only server-side.
 */
export function PrivacyConsentPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [types, setTypes] = useState<ConsentType[]>([]);
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [busyTypeId, setBusyTypeId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const [t, g] = await Promise.all([listActiveConsentTypes(), listMyConsentGrants(person.id)]);
      setTypes(t);
      setGrants(g);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  // Latest decision per consent type (grants come newest-first).
  const currentByType = useMemo(() => {
    const map = new Map<number, ConsentGrant>();
    for (const grant of grants) {
      if (!map.has(grant.consent_type_id)) map.set(grant.consent_type_id, grant);
    }
    return map;
  }, [grants]);

  async function decide(type: ConsentType, status: 'granted' | 'revoked') {
    if (!person) return;
    setBusyTypeId(type.id);
    try {
      const created = await recordConsentDecision({
        personId: person.id,
        consentTypeId: type.id,
        status,
      });
      setGrants((prev) => [created, ...prev]);
    } catch {
      setError(true);
    } finally {
      setBusyTypeId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Privacy and consent"
        lede="You decide what you share. Changing your mind is always allowed."
        crumbs={[
          { to: '/vrcc/today', label: 'Today' },
          { to: '/vrcc/profile', label: 'Profile' },
        ]}
      />
      <div className="mb-5">
        <Alert tone="info">
          Saying no to an optional feature never limits your other services.
        </Alert>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <ul className="flex flex-col gap-4">
          {types.map((type) => {
            const current = currentByType.get(type.id);
            const isGranted = current?.status === 'granted';
            return (
              <li key={type.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-prose">
                      <h2 className="font-semibold text-ink">{type.name}</h2>
                      {type.description ? (
                        <p className="mt-1 text-sm text-ink-muted">{type.description}</p>
                      ) : null}
                      <p className="mt-2 text-sm font-medium">
                        {isGranted ? (
                          <span className="text-positive-700">Currently: allowed</span>
                        ) : current ? (
                          <span className="text-ink-muted">Currently: not allowed</span>
                        ) : (
                          <span className="text-ink-muted">No decision yet</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant={isGranted ? 'secondary' : 'primary'}
                      disabled={busyTypeId === type.id}
                      onClick={() => void decide(type, isGranted ? 'revoked' : 'granted')}
                    >
                      {busyTypeId === type.id ? 'Saving…' : isGranted ? 'Withdraw' : 'Allow'}
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
