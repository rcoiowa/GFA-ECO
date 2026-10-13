import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  listActiveConsentTypes,
  listMyConsentGrants,
  recordResidenceConsentGrant,
  revokeConsentGrant,
} from '@recoveryos/data-access';
import type { ConsentGrant, ConsentType } from '@recoveryos/domain';
import { Alert, Button, Card, LoadingState, PageHeader } from '@recoveryos/ui';

export const HOUSING_CONSENT_KEYS = [
  'residence_screening',
  'electronic_records',
  'information_disclosure',
  'supervision_coordination',
];
export const activeGrant = (g: ConsentGrant) =>
  g.status === 'granted' &&
  !g.revoked_at &&
  (!g.expires_at || new Date(g.expires_at).getTime() > Date.now());

export function HousingConsentPage() {
  const { person } = useAuth();
  const [types, setTypes] = useState<ConsentType[]>([]);
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!person) return;
    const [t, g] = await Promise.all([listActiveConsentTypes(), listMyConsentGrants(person.id)]);
    setTypes(t.filter((x) => HOUSING_CONSENT_KEYS.includes(x.key)));
    setGrants(g);
  }, [person]);
  useEffect(() => {
    void load()
      .catch(() => setError('We couldn’t load your choices. Please reload.'))
      .finally(() => setLoading(false));
  }, [load]);
  async function act(action: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok)
        throw new Error(
          result.message ?? 'That choice did not save. Please try again or ask staff for help.',
        );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your choice did not save.');
    } finally {
      setBusy(false);
    }
  }
  if (!person) return null;
  return (
    <>
      <PageHeader
        title="My housing consent choices"
        lede="Review each choice separately. Signing a document does not automatically grant consent."
      />
      <p className="mb-4">
        Ask staff about anything unclear. Paper signing is available at no cost. Optional sharing is
        separate from your housing application.
      </p>
      {error && <Alert tone="attention">{error}</Alert>}
      {loading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-4">
          {types.map((type) => {
            const active = grants.filter((g) => g.consent_type_id === type.id && activeGrant(g));
            const scoped =
              type.key === 'information_disclosure' || type.key === 'supervision_coordination';
            return (
              <Card key={type.id}>
                <h2 className="font-semibold">{type.name}</h2>
                <p className="mt-2">{type.description}</p>
                {type.key === 'electronic_records' && (
                  <p className="mt-2">
                    You may use paper instead, get copies, or withdraw electronic consent.
                    Withdrawing does not erase records already signed.
                  </p>
                )}
                {type.key === 'residence_screening' && (
                  <p className="mt-2">
                    <Link className="underline" to="/my-housing/documents">
                      Review your assigned screening policy
                    </Link>{' '}
                    and ask staff any questions before deciding.
                  </p>
                )}
                <p className="mt-2">
                  {active.length
                    ? scoped
                      ? 'Permission recorded — review the details below'
                      : 'Currently allowed'
                    : 'No active permission recorded'}
                </p>
                {scoped && (
                  <p className="mt-2">
                    A release must name the recipient, information, and purpose. Review those
                    details with staff. If any details are missing, this screen does not establish
                    permission to share. There is no blanket Allow button here.
                  </p>
                )}
                {active.map((grant) => (
                  <div key={grant.id} className="mt-3">
                    {scoped && (
                      <dl className="mb-3 text-sm">
                        <dt>Recipient</dt>
                        <dd>
                          {String(
                            (grant.scope as Record<string, unknown>)?.recipient_name ??
                              'Not recorded — ask staff to review this permission',
                          )}
                        </dd>
                        <dt>Purpose</dt>
                        <dd>
                          {String(
                            (grant.scope as Record<string, unknown>)?.purpose ?? 'Not recorded',
                          )}
                        </dd>
                        <dt>Information</dt>
                        <dd>
                          {Array.isArray(
                            (grant.scope as Record<string, unknown>)?.information_scope,
                          )
                            ? (
                                (grant.scope as Record<string, unknown>)
                                  .information_scope as string[]
                              )
                                .map((x) => x.replaceAll('_', ' '))
                                .join(', ')
                            : 'Not recorded'}
                        </dd>
                      </dl>
                    )}
                    <Button
                      disabled={busy}
                      variant="secondary"
                      onClick={() => void act(() => revokeConsentGrant({ grantId: grant.id }))}
                    >
                      Withdraw this permission
                    </Button>
                  </div>
                ))}
                {!scoped && !active.length && (
                  <Button
                    className="mt-3"
                    disabled={busy}
                    onClick={() =>
                      void act(() =>
                        recordResidenceConsentGrant({
                          personId: person.id,
                          typeKey: type.key as 'residence_screening' | 'electronic_records',
                        }),
                      )
                    }
                  >
                    {type.key === 'electronic_records'
                      ? 'I choose electronic records and signatures'
                      : 'I give screening consent'}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
