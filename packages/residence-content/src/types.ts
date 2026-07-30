/**
 * The canonical residence document library.
 *
 * Every policy, agreement, rights statement, and paper form the residence
 * uses is authored here — one source of truth, versioned, and written in
 * person-first, trauma-aware, neuro-informed, grace-based language
 * (see docs/language-guide.md).
 *
 * From this package we generate:
 *  - the database seed (document_templates / document_versions) so residents
 *    can review and sign digitally, and
 *  - the printable markdown set in docs/residence-documents/ for binders,
 *    move-in packets, and certification evidence.
 */

export type DocumentCategory =
  | 'agreement' // requires the resident's signature
  | 'rights' // statements of what residents are entitled to
  | 'policy' // how the residence operates
  | 'form'; // fillable paper forms (digital equivalents live in the app)

export interface ResidenceDocument {
  /** Stable key; matches document_templates.key. */
  key: string;
  name: string;
  category: DocumentCategory;
  /** Calendar-based document version, e.g. "2026.07". */
  version: string;
  /** One-sentence plain-language description shown in document lists. */
  summary: string;
  /** True when the document must be acknowledged/signed at move-in. */
  requiresSignature: boolean;
  /**
   * NARR Standard 3.0 references this document evidences
   * (domain.principle.standard rule codes plus a short label).
   * Verify clause codes against the certifying affiliate's current workbook.
   */
  narrReferences: string[];
  /** Iowa HHS Recovery Housing Protocol & Checklist (470-0025) areas. */
  iowaChecklist: string[];
  /** Full document body as markdown. */
  body: string;
}
