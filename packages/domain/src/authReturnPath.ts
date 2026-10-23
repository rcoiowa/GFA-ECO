/** Navigation intent only, never authorization. No identifiers, free text, or auth tokens.
 * Add destinations and finite navigation values here only after privacy review.
 * Unknown query/fragment values are dropped, never copied into auth emails.
 */
// Preserve deployed public destinations and the existing staff intake notification target.
const destinations = new Set([
  '/home',
  '/recovery-residences/my-application',
  '/recovery-residences/grace-house/apply',
  '/recovery-residences/ejwrh/apply',
  '/recovery-residences/list-your-residence',
  '/my-housing',
  '/my-housing/consent',
  '/my-housing/documents',
  '/residence/documents',
  '/staff/document-review',
  '/residences/applications/intake',
]);
const documentKeys = new Set([
  'change_course_leaders_policy',
  'code_of_conduct',
  'code_of_ethics',
  'complete_operational_system',
  'curfew_pass_policy',
  'emergency_response_protocols',
  'exit_transition_policy',
  'fee_schedule_financial_agreement',
  'form_application_prescreening',
  'good_neighbor_policy',
  'grievance_policy_form',
  'incident_report_system',
  'intake_forms_package',
  'medication_mat_moud_policy',
  'narr_ii_self_assessment',
  'participant_agreement',
  'resident_handbook',
  'resident_rights',
  'return_to_use_response_policy',
  'screening_policy_consent',
]);
const tabs = new Set(['application', 'documents', 'consents', 'overview']);
const anchors = new Set(['application', 'documents', 'consents', 'main']);
export function safeAuthReturnPath(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\x00-\x20\x7f]/.test(value)
  )
    return null;
  const url = new URL(value, 'https://navigation.invalid');
  // Exact path comparison also rejects encoding, traversal and URL normalization tricks.
  const rawPath = value.split(/[?#]/, 1)[0];
  if (url.origin !== 'https://navigation.invalid' || url.pathname !== rawPath) return null;
  let path = url.pathname;
  const document = path.match(/^\/(my-housing|residence)\/documents\/([a-z_]+)$/);
  if (document) {
    // Published document keys are content identifiers; assignment IDs are never carried.
    if (!documentKeys.has(document[2]!)) path = `/${document[1]}/documents`;
  } else if (!destinations.has(path)) return null;
  // Queue notifications carry navigation only, never applicant IDs or view state.
  if (path === '/residences/applications/intake') return path;
  const query = new URLSearchParams();
  const tab = url.searchParams.get('tab');
  if (tab && tabs.has(tab) && url.searchParams.getAll('tab').length === 1) query.set('tab', tab);
  const hash = anchors.has(url.hash.slice(1)) ? url.hash : '';
  return path + (query.size ? `?${query}` : '') + hash;
}
export function authFlowPath(
  step: '/sign-in' | '/register' | '/forgot-password' | '/reset-password' | '/onboarding',
  value?: unknown,
): string {
  const next = safeAuthReturnPath(value);
  return next && next !== '/home' ? `${step}?next=${encodeURIComponent(next)}` : step;
}
export function locationReturnPath(location: {
  pathname: string;
  search: string;
  hash: string;
}): string {
  // A refreshed onboarding gate must carry the original destination, not recurse into itself.
  if (location.pathname === '/onboarding') {
    return safeAuthReturnPath(new URLSearchParams(location.search).get('next')) ?? '/home';
  }
  return safeAuthReturnPath(location.pathname + location.search + location.hash) ?? '/home';
}
