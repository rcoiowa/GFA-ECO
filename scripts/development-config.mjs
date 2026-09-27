export const PRODUCTION_REF = 'cqcxvwoukyhxyokfwnjm';
export const RETIRED_REF = 'ykykeioydvtxpyreshhs';
export const PRODUCTION_KEY = 'sb_publishable_OMRkXXJ71z9RlUIAAfy2Jw_h04TYK3x';
export function validateDevelopment(env) {
  const ref = env.DEVELOPMENT_SUPABASE_REF;
  if (!ref || !/^[a-z]{20}$/.test(ref) || [PRODUCTION_REF, RETIRED_REF].includes(ref)) {
    throw new Error('An isolated DEVELOPMENT_SUPABASE_REF is required.');
  }
  if (env.VITE_SUPABASE_URL !== `https://${ref}.supabase.co`) {
    throw new Error('Development URL must match the approved isolated project exactly.');
  }
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!key || key === PRODUCTION_KEY || !key.startsWith('sb_publishable_')) {
    throw new Error('A development publishable key is required; secret/service keys are forbidden.');
  }
  if (!env.VITE_TURNSTILE_SITE_KEY) throw new Error('Development Turnstile site key required.');
  return ref;
}
