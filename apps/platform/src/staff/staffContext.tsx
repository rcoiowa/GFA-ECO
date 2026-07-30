import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@recoveryos/auth';
import { listMyStaffResidences } from '@recoveryos/data-access';
import type { Residence } from '@recoveryos/domain';

interface StaffContextValue {
  loading: boolean;
  residences: Residence[];
  residence: Residence | null;
  setResidenceId: (id: number) => void;
}

const StaffContext = createContext<StaffContextValue | null>(null);

/** Loads the residences this staff person operates and tracks the active one. */
export function StaffProvider({ children }: { children: ReactNode }) {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [residences, setResidences] = useState<Residence[]>([]);
  const [residenceId, setResidenceId] = useState<number | null>(null);

  useEffect(() => {
    if (!person) return;
    let cancelled = false;
    listMyStaffResidences(person.id)
      .then((rows) => {
        if (cancelled) return;
        setResidences(rows);
        setResidenceId((current) => current ?? rows[0]?.id ?? null);
      })
      .catch(() => {
        // Leaves the picker empty; pages show their own empty state.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [person]);

  const value = useMemo(
    () => ({
      loading,
      residences,
      residence: residences.find((r) => r.id === residenceId) ?? null,
      setResidenceId,
    }),
    [loading, residences, residenceId],
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff(): StaffContextValue {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be used inside StaffProvider');
  return ctx;
}
