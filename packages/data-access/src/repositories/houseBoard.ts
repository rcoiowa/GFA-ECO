import type { Person } from '@recoveryos/domain';
import { getSupabase } from '../client';

export interface HousePost {
  id: number;
  residence_id: number;
  author_person_id: number;
  category: 'announcement' | 'meeting_notes' | 'milestone' | 'gratitude';
  title: string;
  body: string | null;
  is_pinned: boolean;
  created_at: string;
}

export type HousePostWithAuthor = HousePost & { author: Person };

/** The residence's board, pinned first (RLS: own residence or staff). */
export async function listHousePosts(residenceId: number): Promise<HousePostWithAuthor[]> {
  const { data, error } = await getSupabase()
    .from('house_posts')
    .select('*, author:people(*)')
    .eq('residence_id', residenceId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

/**
 * Add a post. Residents may share milestones and gratitude; staff post
 * any category (RLS enforces both).
 */
export async function addHousePost(input: {
  residenceId: number;
  authorPersonId: number;
  category: HousePost['category'];
  title: string;
  body?: string;
  isPinned?: boolean;
}): Promise<HousePost> {
  const { data, error } = await getSupabase()
    .from('house_posts')
    .insert({
      residence_id: input.residenceId,
      author_person_id: input.authorPersonId,
      category: input.category,
      title: input.title,
      body: input.body ?? null,
      is_pinned: input.isPinned ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
