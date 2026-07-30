import type { ResidenceDocument } from './types';
import { residentAgreement } from './documents/residentAgreement';
import { residentRights } from './documents/residentRights';
import { houseGuidelines } from './documents/houseGuidelines';
import { feeAgreement } from './documents/feeAgreement';
import { grievancePolicy } from './documents/grievancePolicy';
import { screeningPolicy } from './documents/screeningPolicy';
import { returnToUsePolicy } from './documents/returnToUsePolicy';
import { medicationPolicy } from './documents/medicationPolicy';
import { overdosePreventionPolicy } from './documents/overdosePreventionPolicy';
import { emergencyProcedures } from './documents/emergencyProcedures';
import { guestPolicy } from './documents/guestPolicy';
import { goodNeighborPolicy } from './documents/goodNeighborPolicy';
import { confidentialityPolicy } from './documents/confidentialityPolicy';
import { propertyPolicy } from './documents/propertyPolicy';
import { transitionPolicy } from './documents/transitionPolicy';
import { codeOfEthics } from './documents/codeOfEthics';
import {
  emergencyContactForm,
  grievanceForm,
  incidentReportForm,
  intakeApplication,
  medicationDisclosureForm,
  moveInInventoryForm,
  overnightPassForm,
  releaseOfInformationForm,
} from './forms';

/**
 * The complete document library, in the order it appears in the move-in
 * packet and the app's Documents area.
 */
export const allDocuments: ResidenceDocument[] = [
  // Agreements — signed at move-in
  residentAgreement,
  residentRights,
  houseGuidelines,
  feeAgreement,
  screeningPolicy,
  // Policies — provided at move-in, posted in the home
  grievancePolicy,
  returnToUsePolicy,
  medicationPolicy,
  overdosePreventionPolicy,
  emergencyProcedures,
  guestPolicy,
  goodNeighborPolicy,
  confidentialityPolicy,
  propertyPolicy,
  transitionPolicy,
  codeOfEthics,
  // Forms
  intakeApplication,
  emergencyContactForm,
  releaseOfInformationForm,
  medicationDisclosureForm,
  moveInInventoryForm,
  overnightPassForm,
  grievanceForm,
  incidentReportForm,
];

const byKey = new Map(allDocuments.map((d) => [d.key, d]));

export function getDocument(key: string): ResidenceDocument | undefined {
  return byKey.get(key);
}

/** Documents every resident signs at move-in, in signing order. */
export const moveInSignatureSet: ResidenceDocument[] = allDocuments.filter(
  (d) => d.requiresSignature,
);
