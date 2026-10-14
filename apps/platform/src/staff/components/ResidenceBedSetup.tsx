import { useEffect, useState } from 'react';
import { addResidenceRoomBeds, setResidenceCapacity } from '@recoveryos/data-access';
import { Alert, Button, Card, CardTitle, TextField } from '@recoveryos/ui';

export function ResidenceBedSetup({
  residenceId,
  initialCapacity,
  onSaved,
}: {
  residenceId: number;
  initialCapacity: number | null;
  onSaved: () => Promise<void>;
}) {
  const [savedCapacity, setSavedCapacity] = useState(initialCapacity);
  const [capacity, setCapacity] = useState(initialCapacity?.toString() ?? '');
  const [unit, setUnit] = useState('');
  const [room, setRoom] = useState('');
  const [beds, setBeds] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setSavedCapacity(initialCapacity);
    setCapacity(initialCapacity?.toString() ?? '');
    setUnit('');
    setRoom('');
    setBeds('');
    setMessage(null);
    setError(null);
  }, [residenceId, initialCapacity]);
  const validNumber = (s: string, min: number) =>
    s.trim() !== '' && Number.isInteger(Number(s)) && Number(s) >= min && Number(s) <= 1000;
  const act = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardTitle>Capacity and room setup</CardTitle>
      <p className="mt-2">
        Use the residence’s confirmed operating capacity. Capacity is separate from the physical
        beds configured below; neither establishes certification or guarantees availability.
      </p>
      {error ? <Alert tone="critical">{error}</Alert> : null}
      {message ? <Alert tone="positive">{message}</Alert> : null}
      <div className="mt-3 space-y-3">
        <TextField
          label="Confirmed bed capacity"
          type="number"
          min={0}
          max={1000}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <Button
          disabled={busy || !validNumber(capacity, 0)}
          onClick={() =>
            void act(async () => {
              await setResidenceCapacity(residenceId, Number(capacity), savedCapacity);
              setSavedCapacity(Number(capacity));
            }, 'Capacity saved.')
          }
        >
          Save capacity
        </Button>
        <h3 className="font-semibold">Add an actual room and its beds</h3>
        <TextField
          label="Unit or floor name"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <TextField label="Room name" value={room} onChange={(e) => setRoom(e.target.value)} />
        <TextField
          label="Beds in this room"
          type="number"
          min={1}
          max={100}
          value={beds}
          onChange={(e) => setBeds(e.target.value)}
        />
        <Button
          disabled={
            busy || !unit.trim() || !room.trim() || !validNumber(beds, 1) || Number(beds) > 100
          }
          onClick={() =>
            void act(async () => {
              await addResidenceRoomBeds(residenceId, unit.trim(), room.trim(), Number(beds));
              setRoom('');
              setBeds('');
            }, 'Room and beds added.')
          }
        >
          Add room and beds
        </Button>
      </div>
    </Card>
  );
}
