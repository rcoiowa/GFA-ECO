import { useState } from 'react';
import { reopenHousingApplication } from '@recoveryos/data-access';
import { Alert, Button, TextField } from '@recoveryos/ui';

export function ReopenApplication({
  applicationId,
  status,
  onSaved,
}: {
  applicationId: number;
  status: string;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Return to review
      </Button>
    );
  return (
    <div className="mt-3 space-y-3">
      <p>
        This returns the decision to review. It preserves the application, prior decision history,
        signatures, and consent records. It does not undo a move-in or resolve a duplicate person.
      </p>
      <TextField
        label="Reason for returning to review"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {error ? <Alert tone="critical">{error}</Alert> : null}
      <Button
        disabled={busy || reason.trim().length < 10}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await reopenHousingApplication(applicationId, status, reason.trim());
            setOpen(false);
            setReason('');
            await onSaved();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : 'Unable to return this application to review.',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Confirm return to review
      </Button>
      <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
