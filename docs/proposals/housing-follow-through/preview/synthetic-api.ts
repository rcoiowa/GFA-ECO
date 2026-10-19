// This module is aliased ONLY by vite.review.config.ts in a separate localhost harness.
export const getAdminOperationsSummary = async () => ({ ok: true });
export const adminListResidences = async () => [{ id: 9010 }];
export const listApplicationIntake = async () => [
  {
    id: 9100,
    residence_id: 9010,
    status: 'converted',
    converted_person_id: 9050,
    converted_application_id: 9500,
  },
];
export const listResidenceRoster = async () => [{ person_id: 9050 }];
export const useAuth = () => ({ person: { id: 9001 } });
