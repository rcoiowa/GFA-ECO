import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getMyPerson, getMyRoleAssignments, getSupabase } from '@recoveryos/data-access';
import type { Person, RoleAssignment, RoleKey } from '@recoveryos/domain';

export interface AuthState {
  /** Supabase session loading is finished (regardless of outcome). */
  ready: boolean;
  session: Session | null;
  person: Person | null;
  roles: RoleKey[];
  roleAssignments: RoleAssignment[];
  /** Re-fetch person + roles (e.g. after onboarding provisions the person). */
  refreshIdentity: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);

  const loadIdentity = useCallback(async () => {
    try {
      const me = await getMyPerson();
      setPerson(me);
      setRoleAssignments(me ? await getMyRoleAssignments(me.id) : []);
    } catch {
      // Identity load failures leave the user signed in but unprovisioned;
      // route guards send them to onboarding rather than crashing the shell.
      setPerson(null);
      setRoleAssignments([]);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) await loadIdentity();
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (cancelled) return;
      setSession(next);
      if (next) {
        await loadIdentity();
      } else {
        setPerson(null);
        setRoleAssignments([]);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadIdentity]);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      person,
      roles: [...new Set(roleAssignments.map((r) => r.role_key))],
      roleAssignments,
      refreshIdentity: loadIdentity,
      signOut,
    }),
    [ready, session, person, roleAssignments, loadIdentity, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
