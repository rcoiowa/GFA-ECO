/** Navigation intent only, never authorization. No identifiers, free text, or auth tokens.
 * Add destinations and finite navigation values here only after privacy review.
 * Unknown query/fragment values are dropped, never copied into auth emails.
 */
const destinations = new Set([
  '/admin',
  '/admin/access',
  '/admin/audit',
  '/admin/directory/submissions',
  '/admin/evidence',
  '/admin/notifications',
  '/admin/operations',
  '/admin/people',
  '/admin/residences',
  '/admin/system',
  '/coach',
  '/coach/follow-ups',
  '/coach/messages',
  '/coach/notifications',
  '/coach/participants',
  '/coach/requests',
  '/coach/sessions',
  '/home',
  '/my-housing',
  '/my-housing/consent',
  '/my-housing/documents',
  '/navigator',
  '/navigator/connections',
  '/navigator/follow-ups',
  '/navigator/messages',
  '/navigator/notifications',
  '/navigator/people',
  '/navigator/requests',
  '/recovery-residences/ejwrh/apply',
  '/recovery-residences/grace-house/apply',
  '/recovery-residences/list-your-residence',
  '/recovery-residences/my-application',
  '/residence',
  '/residence/connect',
  '/residence/documents',
  '/residence/documents/grievance',
  '/residence/house',
  '/residence/journey',
  '/residence/recovery',
  '/residence/schedule',
  '/residence/support/grounding',
  '/residence/today',
  '/residences',
  '/residences/applications/intake',
  '/staff',
  '/staff/applications',
  '/staff/beds',
  '/staff/board',
  '/staff/compliance',
  '/staff/document-review',
  '/staff/fees',
  '/staff/grievances',
  '/staff/house-ops',
  '/staff/incidents',
  '/staff/inquiries',
  '/staff/messages',
  '/staff/notifications',
  '/staff/reports',
  '/staff/residents',
  '/staff/screenings',
  '/staff/today',
  '/vrcc',
  '/vrcc/check-in',
  '/vrcc/connect',
  '/vrcc/getting-settled',
  '/vrcc/grace',
  '/vrcc/journey',
  '/vrcc/learn',
  '/vrcc/messages',
  '/vrcc/notifications',
  '/vrcc/privacy',
  '/vrcc/profile',
  '/vrcc/recovery',
  '/vrcc/resources',
  '/vrcc/sessions',
  '/vrcc/support/grounding',
  '/vrcc/today',
  '/vrcc/tools',
  '/vrcc/tools/recovery-capital',
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
  const record = path.match(
    /^\/(staff\/messages|coach\/(?:messages|participants)|navigator\/(?:messages|people))\/[0-9]+$/,
  );
  if (document) {
    // Published document keys are content identifiers; assignment IDs are never carried.
    if (!documentKeys.has(document[2]!)) path = `/${document[1]}/documents`;
  } else if (record) {
    // Person IDs must not enter auth emails/history. Return to the scoped list to reselect.
    path = `/${record[1]}`;
  } else if (!destinations.has(path)) return null;
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
