import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { grantRoleAssignment, revokeRoleAssignment, type AdminPersonRow } from '@recoveryos/data-access';
import { Alert, Button, Card, CardTitle, ErrorState, LoadingState, PageHeader, TextField } from '@recoveryos/ui';
import { roleAuthorityLabel } from '@recoveryos/domain';
import { useAdminPeople, useAdminResidences } from '../hooks/useAdminData';
import { adminKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * People & Access — identity, roles, and active connections. Deliberately NOT
 * a dossier: no recovery narrative, no check-ins, no messages, no risk
 * anything. The engagement flags are yes/no facts about whether a support
 * relationship exists, which is what an administrator staffing the platform
 * actually needs.
 */

const GRANTABLE_ROLES = [
  'participant',
  'coach',
  'navigator',
  'program_manager',
  'residence_staff',
  'residence_manager',
  'resident',
  'administrator',
  'executive',
  'system_administrator',
] as const;

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'Role changes here are limited to platform administrators.',
  privilege_tier: 'Only a system administrator can change that role.',
  residence_scope_required: 'That role needs a residence.',
  last_admin: 'Refused: that is the last active platform administrator. Grant another administrator first.',
  person_not_found: 'That person no longer exists.',
  residence_not_found: 'That residence doesn’t exist.',
};

function needsResidence(role: string) {
  return role === 'residence_staff' || role === 'residence_manager' || role === 'resident';
}

export function PeoplePage() {
  const queryClient = useQueryClient();
  const people = useAdminPeople();
  const residences = useAdminResidences();
  const [filter, setFilter] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.people });
    void queryClient.invalidateQueries({ queryKey: adminKeys.audit });
  };

  const grant = useMutation({
    mutationFn: (input: { personId: number; role: string; residenceId: number | null }) =>
      grantRoleAssignment(input),
    onSuccess: (result) => {
      if (result.ok) {
        track('role_assignment_granted');
        setFeedback(null);
        invalidate();
      } else {
        setFeedback(ERROR_MESSAGES[result.code ?? ''] ?? 'The role was not granted.');
      }
    },
  });

  const revoke = useMutation({
    mutationFn: (assignmentId: number) => revokeRoleAssignment(assignmentId),
    onSuccess: (result) => {
      if (result.ok) {
        track('role_assignment_revoked');
        setFeedback(null);
        invalidate();
      } else {
        setFeedback(ERROR_MESSAGES[result.code ?? ''] ?? 'The role was not revoked.');
      }
    },
  });

  if (people.isLoading) return <LoadingState label="Loading people…" />;
  if (people.isError)
    return <ErrorState message="We couldn’t load people right now." onRetry={() => void people.refetch()} />;

  const rows = (people.data ?? []).filter(
    (p) => !filter.trim() || p.display_name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="People & Access"
        lede="Identity, roles, and whether a support relationship exists — never anyone's story."
      />

      <TextField
        label="Find someone"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Name…"
      />

      {feedback ? <Alert tone="attention">{feedback}</Alert> : null}

      <div className="space-y-3">
        {rows.map((person) => (
          <PersonCard
            key={person.person_id}
            person={person}
            residences={(residences.data ?? []).map((r) => ({ id: r.id, name: r.name }))}
            onGrant={(role, residenceId) =>
              grant.mutate({ personId: person.person_id, role, residenceId })
            }
            onRevoke={(assignmentId) => revoke.mutate(assignmentId)}
            busy={grant.isPending || revoke.isPending}
          />
        ))}
        {rows.length === 0 ? <p className="text-ink-muted">No one matches that name.</p> : null}
      </div>

      <p className="text-sm text-ink-faint">
        Revoking a role takes effect immediately across every workspace. The platform refuses to
        revoke its last active administrator.
      </p>
    </div>
  );
}

function PersonCard({
  person,
  residences,
  onGrant,
  onRevoke,
  busy,
}: {
  person: AdminPersonRow;
  residences: Array<{ id: number; name: string }>;
  onGrant: (role: string, residenceId: number | null) => void;
  onRevoke: (assignmentId: number) => void;
  busy: boolean;
}) {
  const [granting, setGranting] = useState(false);
  const [role, setRole] = useState<string>('coach');
  const [residenceId, setResidenceId] = useState<string>('');
  const [revokeConfirm, setRevokeConfirm] = useState<number | null>(null);

  const residenceNameOf = (id: number | null) =>
    id == null ? null : (residences.find((r) => r.id === id)?.name ?? `Residence ${id}`);

  const connections = [
    person.has_active_coaching ? 'coaching' : null,
    person.has_active_navigation ? 'navigation' : null,
    person.has_active_residency ? 'residency' : null,
  ].filter(Boolean);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{person.display_name}</CardTitle>
        {person.classification !== 'production' ? (
          <span className="rounded-full bg-surface-sunken px-3 py-1 text-sm text-ink-muted">
            {person.classification} account — excluded from evidence
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {connections.length > 0
          ? `Active connections: ${connections.join(', ')}.`
          : 'No active support connections.'}
      </p>

      <ul className="mt-2 flex flex-wrap gap-2">
        {person.roles.map((r) => (
          <li
            key={r.assignment_id}
            className="flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-1 text-sm"
          >
            <span className="text-ink">{roleAuthorityLabel(r.role, residenceNameOf(r.residence_id))}</span>
            {revokeConfirm === r.assignment_id ? (
              <>
                <button
                  type="button"
                  className="font-medium text-critical-700 underline underline-offset-2"
                  disabled={busy}
                  onClick={() => {
                    onRevoke(r.assignment_id);
                    setRevokeConfirm(null);
                  }}
                >
                  Confirm revoke
                </button>
                <button
                  type="button"
                  className="text-ink-muted underline underline-offset-2"
                  onClick={() => setRevokeConfirm(null)}
                >
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                className="text-ink-faint underline underline-offset-2 hover:text-critical-700"
                onClick={() => setRevokeConfirm(r.assignment_id)}
              >
                Revoke
              </button>
            )}
          </li>
        ))}
        {person.roles.length === 0 ? <li className="text-sm text-ink-muted">No roles.</li> : null}
      </ul>

      {granting ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`grant-role-${person.person_id}`} className="text-sm font-medium text-ink">
              Role
            </label>
            <select
              id={`grant-role-${person.person_id}`}
              className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {GRANTABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleAuthorityLabel(r)}
                </option>
              ))}
            </select>
          </div>
          {needsResidence(role) ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`grant-residence-${person.person_id}`}
                className="text-sm font-medium text-ink"
              >
                Residence
              </label>
              <select
                id={`grant-residence-${person.person_id}`}
                className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
                value={residenceId}
                onChange={(e) => setResidenceId(e.target.value)}
              >
                <option value="">Choose…</option>
                {residences.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button
            disabled={busy || (needsResidence(role) && !residenceId)}
            onClick={() => {
              onGrant(role, needsResidence(role) && residenceId ? Number(residenceId) : null);
              setGranting(false);
            }}
          >
            Grant {roleAuthorityLabel(role)}
          </Button>
          <Button variant="secondary" onClick={() => setGranting(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="ghost" className="mt-2" onClick={() => setGranting(true)}>
          Grant a role
        </Button>
      )}
    </Card>
  );
}
