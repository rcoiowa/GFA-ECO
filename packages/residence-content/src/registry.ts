import type { ResidenceDocument } from './types';
import { participantAgreement } from './documents/participantAgreement';
import { codeOfConduct } from './documents/codeOfConduct';
import { residentHandbook } from './documents/residentHandbook';
import { feeScheduleFinancialAgreement } from './documents/feeScheduleFinancialAgreement';
import { screeningPolicyConsent } from './documents/screeningPolicyConsent';
import { medicationMatMoudPolicy } from './documents/medicationMatMoudPolicy';
import { curfewPassPolicy } from './documents/curfewPassPolicy';
import { returnToUseResponsePolicy } from './documents/returnToUseResponsePolicy';
import { grievancePolicyForm } from './documents/grievancePolicyForm';
import { incidentReportSystem } from './documents/incidentReportSystem';
import { emergencyResponseProtocols } from './documents/emergencyResponseProtocols';
import { goodNeighborPolicy } from './documents/goodNeighborPolicy';
import { exitTransitionPolicy } from './documents/exitTransitionPolicy';
import { codeOfEthics } from './documents/codeOfEthics';
import { changeCourseLeadersPolicy } from './documents/changeCourseLeadersPolicy';
import { narrIiSelfAssessment } from './documents/narrIiSelfAssessment';
import { applicationPrescreeningForm } from './documents/applicationPrescreeningForm';
import { intakeFormsPackage } from './documents/intakeFormsPackage';
import { completeOperationalSystem } from './documents/completeOperationalSystem';

/**
 * The complete Grace House document library — imported verbatim from the
 * canonical operational document set (v2, 2026), in the order used by the
 * application process and the app's Documents area.
 */
export const allDocuments: ResidenceDocument[] = [
  participantAgreement,
  codeOfConduct,
  residentHandbook,
  feeScheduleFinancialAgreement,
  screeningPolicyConsent,
  medicationMatMoudPolicy,
  curfewPassPolicy,
  returnToUseResponsePolicy,
  grievancePolicyForm,
  incidentReportSystem,
  emergencyResponseProtocols,
  goodNeighborPolicy,
  exitTransitionPolicy,
  codeOfEthics,
  changeCourseLeadersPolicy,
  narrIiSelfAssessment,
  applicationPrescreeningForm,
  intakeFormsPackage,
  completeOperationalSystem,
];

const byKey = new Map(allDocuments.map((d) => [d.key, d]));

export function getDocument(key: string): ResidenceDocument | undefined {
  return byKey.get(key);
}

/** Documents every participant signs/acknowledges at intake, in order. */
export const moveInSignatureSet: ResidenceDocument[] = allDocuments.filter(
  (d) => d.requiresSignature,
);
