import type { Person, PersonProfile, RoleAssignment } from '@recoveryos/domain';
import { getSupabase } from '../client';

/** The current user's person record, or null if not yet provisioned. */
/**
 * The signed-in user's own person record.
 *
 * Filters on `auth_user_id` explicitly. It must never rely on RLS to narrow
 * `people` to a single row: staff can legitimately see the people they
 * support, so an unfiltered `.maybeSingle()` throws for anyone holding a
 * residence role — which previously wiped their identity and trapped them in
 * the onboarding redirect loop.
 */
export async function getMyPerson(authUserId: string): Promise<Person | null> {
  const { data, error } = await getSupabase()
    .from('people')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyProfile(personId: number): Promise<PersonProfile | null> {
  const { data, error } = await getSupabase()
    .from('person_profiles')
    .select('*')
    .eq('person_id', personId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Active (unrevoked) role assignments for the current user's person. */
export async function getMyRoleAssignments(personId: number): Promise<RoleAssignment[]> {
  const { data, error } = await getSupabase()
    .from('role_assignments')
    .select('*')
    .eq('person_id', personId)
    .is('revoked_at', null);
  if (error) throw error;
  return data ?? [];
}

/**
 * Ensure a person record exists for the signed-in auth user.
 * Backed by a security-definer RPC that creates person + profile + default
 * participant role on first sign-in, idempotently.
 */
export async function ensureMyPerson(input: {
  firstName: string;
  lastName: string;
}): Promise<Person> {
  const { data, error } = await getSupabase().rpc('ensure_person_for_current_user', {
    p_first_name: input.firstName,
    p_last_name: input.lastName,
  });
  if (error) throw error;
  return data as Person;
}
