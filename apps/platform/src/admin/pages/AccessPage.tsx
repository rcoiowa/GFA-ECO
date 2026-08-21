import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaffInvitation, revokeStaffInvitation } from '@recoveryos/data-access';
import { Alert, Button, Card, CardTitle, ErrorState, LoadingState, PageHeader, TextField } from '@recoveryos/ui';
import { roleAuthorityLabel } from '@recoveryos/domain';
import { useAdminInvitations, useAdminResidences } from '../hooks/useAdminData';
import { adminKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * Access — invitations state their exact authority before they exist (§35).
 * The server is the gate (privilege tiers, scope requirements, one open
 * invitation per email); this page shows exactly what will be granted and
 * relays the server's answer honestly.
 */

const INVITABLE_ROLES = [
  'coach',
  'navigator',
  'program_manager',
  'residence_staff',
  'residence_manager',
  'administrator',
  'system_administrator',
] as const;

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'Invitations are created by platform administrators.',
  privilege_tier: 'Only a system administrator can invite a system administrator.',
  invitation_exists: 'There is already an open invitation for that email.',
  residence_scope_required: 'Residence roles need the residence they apply to.',
  invalid_operator_invitation: 'An operator invitation is Residence Manager with no pre-existing residence.',
  invalid_email: 'That email address doesn’t look right.',
  roles_required: 'Pick the role the invitation grants.',
  residence_not_found: 'That residence doesn’t exist.',
};

function needsResidence(role: string) {
  return role === 'residence_staff' || role === 'residence_manager';
}

export function AccessPage() {
  const queryClient = useQueryClient();
  const invitations = useAdminInvitations();
  const residences = useAdminResidences();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('coach');
  const [operator, setOperator] = useState(false);
  const [residenceId, setResidenceId] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'positive' | 'critical'; text: string } | null>(null);

  const residenceName = residences.data?.find((r) => String(r.id) === residenceId)?.name ?? null;
  const authority = operator
    ? 'Residence Operator — may create and manage one new residence'
    : roleAuthorityLabel(role, needsResidence(role) ? residenceName : null);

  const create = useMutation({
    mutationFn: () =>
      createStaffInvitation({
        email: email.trim(),
        roleKeys: operator ? ['residence_manager'] : [role],
        purpose: operator ? 'operator' : 'staff',
        residenceId: !operator && needsResidence(role) && residenceId ? Number(residenceId) : null,
      }),
    onSuccess: (result) => {
      setConfirming(false);
      if (result.ok) {
        track('staff_invitation_created');
        setFeedback({ tone: 'positive', text: `Invitation created for ${email.trim()} — ${authority}.` });
        setEmail('');
        void queryClient.invalidateQueries({ queryKey: adminKeys.invitations });
      } else {
        setFeedback({
          tone: 'critical',
          text: ERROR_MESSAGES[result.code ?? ''] ?? 'The invitation was not created.',
        });
      }
    },
  });

  const revoke = useMutation({
    mutationFn: (invitationId: number) => revokeStaffInvitation(invitationId),
    onSuccess: (result) => {
      if (result.ok) {
        track('staff_invitation_revoked');
        void queryClient.invalidateQueries({ queryKey: adminKeys.invitations });
      }
    },
  });

  const openInvitations = (invitations.data ?? []).filter((i) => !i.consumed_at && !i.revoked_at);
  const settled = (invitations.data ?? []).filter((i) => i.consumed_at || i.revoked_at);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Access"
        lede="Who can act with authority here — and exactly which authority. Signup grants only what an open invitation pre-authorizes."
      />

      <Card>
        <CardTitle>Invite a staff member or operator</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setConfirming(false);
            }}
            placeholder="name@example.org"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className="font-medium text-ink">
              Authority
            </label>
            <select
              id="invite-role"
              className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
              value={operator ? 'operator' : role}
              onChange={(e) => {
                const v = e.target.value;
                setOperator(v === 'operator');
                if (v !== 'operator') setRole(v);
                setConfirming(false);
              }}
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleAuthorityLabel(r)}
                </option>
              ))}
              <option value="operator">Residence Operator (new residence)</option>
            </select>
          </div>
          {!operator && needsResidence(role) ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-residence" className="font-medium text-ink">
                Residence (required for this role)
              </label>
              <select
                id="invite-residence"
                className="min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
                value={residenceId}
                onChange={(e) => {
                  setResidenceId(e.target.value);
                  setConfirming(false);
                }}
              >
                <option value="">Choose a residence…</option>
                {(residences.data ?? []).map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {confirming ? (
          <div className="mt-4 rounded-md border border-line bg-surface-sunken px-4 py-3">
            <p className="text-ink">
              This invitation grants <span className="font-semibold">{authority}</span> to{' '}
              <span className="font-semibold">{email.trim()}</span> when they sign up with that
              email. It expires in 30 days and can be revoked until it’s used.
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => create.mutate()} disabled={create.isPending}>
                {create.isPending ? 'Creating…' : 'Create invitation'}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="mt-4"
            onClick={() => {
              setFeedback(null);
              setConfirming(true);
            }}
            disabled={!email.trim() || (!operator && needsResidence(role) && !residenceId)}
          >
            Review invitation
          </Button>
        )}

        {feedback ? (
          <div className="mt-3">
            <Alert tone={feedback.tone === 'positive' ? 'positive' : 'critical'}>{feedback.text}</Alert>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Open invitations</CardTitle>
        {invitations.isLoading ? (
          <LoadingState />
        ) : invitations.isError ? (
          <ErrorState onRetry={() => void invitations.refetch()} />
        ) : openInvitations.length === 0 ? (
          <p className="mt-1 text-ink-muted">No invitations are waiting to be used.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {openInvitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-raised px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{inv.email}</p>
                  <p className="text-sm text-ink-muted">
                    {inv.purpose === 'operator'
                      ? 'Residence Operator (new residence)'
                      : inv.role_keys.map((r) => roleAuthorityLabel(r)).join(', ')}
                    {inv.expires_at
                      ? ` · expires ${new Date(inv.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                      : ''}
                  </p>
                </div>
                <Button variant="danger" onClick={() => revoke.mutate(inv.id)} disabled={revoke.isPending}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {settled.length > 0 ? (
        <Card>
          <CardTitle>Settled invitations</CardTitle>
          <ul className="mt-2 space-y-1.5">
            {settled.slice(0, 20).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{inv.email}</span>
                <span className="text-ink-muted">{inv.consumed_at ? 'used' : 'revoked'}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-sm text-ink-faint">
        Roles for existing people are granted and revoked from People. Every grant, revocation, and
        invitation is written to the audit trail with the acting administrator.
      </p>
    </div>
  );
}
