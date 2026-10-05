export type ResourceCategory = 'Recovery & connection' | 'Housing & essentials' | 'Work & benefits' | 'Legal help' | 'Support now';

export type CommunityResource = {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  href: string;
  action: string;
  external: boolean;
  keywords: string;
};

export const resourceCategories: ResourceCategory[] = [
  'Recovery & connection', 'Housing & essentials', 'Work & benefits', 'Legal help', 'Support now',
];

// Public navigation only: provider websites remain the authority for eligibility,
// hours, schedules, and availability. External source pages reviewed 2026-10-05.
export const communityResources: CommunityResource[] = [
  { id: 'gfa-peer', name: 'GFA peer support', category: 'Recovery & connection', description: 'Start at the front desk for the GFA Warmline and help choosing a next step.', href: '/community-center/front-desk', action: 'Visit the front desk', external: false, keywords: 'coach warmline talk person peer' },
  { id: 'recovery-iowa', name: 'Recovery Iowa', category: 'Recovery & connection', description: 'Explore Iowa recovery resources, support networks, and educational tools through Recovery Iowa’s existing directory.', href: 'https://recovery-iowa.org/get-support/', action: 'Explore Recovery Iowa', external: true, keywords: 'statewide map recovery community center meeting peer substance use' },
  { id: 'nami', name: 'NAMI Iowa support groups', category: 'Recovery & connection', description: 'Find mental health support group information for individuals and families. Check the provider for current meeting details.', href: 'https://namiiowa.org/support-and-education/support-groups/', action: 'Find support groups', external: true, keywords: 'family mental health belonging group' },
  { id: 'housing', name: 'Recovery housing in RecoveryOS', category: 'Housing & essentials', description: 'Explore Grace House and Ernest & Johnnie White Recovery House information and application paths.', href: '/recovery-residences', action: 'Explore recovery housing', external: false, keywords: 'residence grace house ejwrh application home' },
  { id: '211', name: 'Iowa 211 resource search', category: 'Housing & essentials', description: 'Search local resources for food, shelter, utilities, transportation, and other practical needs by location.', href: 'https://search.211iowa.org/', action: 'Search Iowa 211', external: true, keywords: 'food pantry rent shelter utilities transportation child care reentry' },
  { id: 'iowaworks', name: 'IowaWORKS', category: 'Work & benefits', description: 'Find IowaWORKS centers for job search, career assistance, training connections, and employment services.', href: 'https://workforce.iowa.gov/jobs/iowaworks', action: 'Find employment support', external: true, keywords: 'job resume interview career training unemployment work' },
  { id: 'hhs', name: 'Iowa HHS assistance programs', category: 'Work & benefits', description: 'Learn how to check eligibility and apply for food assistance, health coverage, and other Iowa HHS services.', href: 'https://hhs.iowa.gov/assistance-programs/apply', action: 'Explore assistance programs', external: true, keywords: 'snap food medicaid benefits child care insurance' },
  { id: 'legal', name: 'Iowa Legal Aid', category: 'Legal help', description: 'Find civil legal information and ways to request legal help, including housing and family matters. Eligibility is determined by Iowa Legal Aid.', href: 'https://iowalegalaid.org/', action: 'Explore legal help', external: true, keywords: 'eviction landlord rights family civil legal' },
  { id: 'support', name: 'RecoveryOS Support Now', category: 'Support now', description: 'Open immediate support options, including crisis and warmline contacts, without an account.', href: '/support', action: 'Open Support Now', external: false, keywords: '988 911 crisis urgent safety warmline' },
  { id: 'yli', name: 'Your Life Iowa', category: 'Support now', description: 'Find 24/7 support and information for alcohol, drugs, gambling, mental health, and concerns about a loved one.', href: 'https://yourlifeiowa.org/', action: 'Visit Your Life Iowa', external: true, keywords: 'family mental health gambling substance use help navigation' },
];
