#!/usr/bin/env python3
"""One-off: rebuild packages/residence-content document modules from the
uploaded Grace House docx set (the canonical v2 operational documents)."""
import zipfile, re, os
from xml.etree import ElementTree as ET

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}
SRC = '/tmp/claude-0/-home-user-GFA-ECO/74b42d08-16c2-5ee6-8bb3-485afe4a0e40/scratchpad/gh'
OUT = '/home/user/GFA-ECO/packages/residence-content/src/documents'

def runs_text(p):
    parts = []
    for node in p.iter():
        tag = node.tag.split('}')[1]
        if tag == 't':
            parts.append(node.text or '')
        elif tag in ('br', 'cr'):
            parts.append('\n')
    return ''.join(parts)

def para_style(p):
    s = p.find('.//w:pPr/w:pStyle', NS)
    return s.get(f'{{{W}}}val') if s is not None else ''

def is_list(p):
    return p.find('.//w:pPr/w:numPr', NS) is not None

def cell_text(tc):
    paras = [runs_text(p).strip() for p in tc.findall('.//w:p', NS)]
    return [t for t in paras if t]

def extract(path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read('word/document.xml'))
    body = root.find('w:body', NS)
    blocks = []  # ('p', text) | ('h', level, text) | ('li', text) | ('table', rows)
    for el in body:
        tag = el.tag.split('}')[1]
        if tag == 'p':
            txt = runs_text(el).strip()
            if not txt:
                continue
            st = para_style(el)
            if st and st.startswith('Heading'):
                lvl = int(re.sub(r'\D', '', st) or 1)
                blocks.append(('h', min(lvl, 4), txt))
            elif st == 'Title':
                blocks.append(('h', 1, txt))
            elif is_list(el):
                blocks.append(('li', txt))
            else:
                blocks.append(('p', txt))
        elif tag == 'tbl':
            rows = []
            for tr in el.findall('.//w:tr', NS):
                rows.append([cell_text(tc) for tc in tr.findall('w:tc', NS)])
            blocks.append(('table', rows))
    return blocks

def esc_cell(paras):
    return ' <br> '.join(' '.join(p.split()) for p in paras) if paras else ''

def render(blocks):
    out = []
    for b in blocks:
        kind = b[0]
        if kind == 'h':
            out.append('#' * b[1] + ' ' + b[2])
        elif kind == 'li':
            out.append('- ' + ' '.join(b[1].split()))
        elif kind == 'p':
            # keep intentional line breaks as markdown hard breaks
            lines = [l.strip() for l in b[1].split('\n') if l.strip()]
            out.append('  \n'.join(lines))
        elif kind == 'table':
            rows = b[1]
            if not rows:
                continue
            if len(rows) == 1 and len(rows[0]) == 1:
                # single-cell callout box -> blockquote, preserving paragraphs
                cell = rows[0][0]
                out.append('\n'.join('> ' + ' '.join(p.split()) for p in cell) or '>')
            else:
                width = max(len(r) for r in rows)
                lines = []
                for i, r in enumerate(rows):
                    cells = [esc_cell(c).replace('|', '\\|') for c in r]
                    cells += [''] * (width - len(cells))
                    lines.append('| ' + ' | '.join(cells) + ' |')
                    if i == 0:
                        lines.append('|' + ' --- |' * width)
                out.append('\n'.join(lines))
    return '\n\n'.join(out) + '\n'

DOCS = [
  # (docx, key, tsfile, name, category, version, requiresSignature, summary, narr, iowa)
  ('GraceHouse_Participant_Agreement.docx', 'participant_agreement', 'participantAgreement',
   'Participant Agreement', 'agreement', '2.0', True,
   'Your program participation agreement — not a lease. Fees, recovery participation, community expectations, and the mutual commitment Grace House makes to you.',
   ['1.A.3.a — fees disclosed in writing before any funds accepted', '1.A.3.c — refund policy disclosed before binding agreement', '1.B.5.a — written agreement before committing to terms', '1.A.2.d — non-discrimination statement'],
   ['Item 4 — clinical treatment from provider of your choice', 'Item 6 — MAT medications never a violation', 'Item 7 — eligibility documented at Part B']),
  ('GraceHouse_Code_of_Conduct.docx', 'code_of_conduct', 'codeOfConduct',
   'Code of Conduct', 'agreement', '1.0', True,
   'The community standards every resident commits to — grace-centered accountability, non-negotiable safety standards, and your rights.',
   ['2.F.16.a — alcohol and illicit drug prohibition', '3.H.26.a — empathy and positive regard modeled', '1.C.7.c — resident rights posted', '1.B.6.c — social media privacy'],
   ['Item 2 — family-like shared living centered on peer support']),
  ('GraceHouse_Resident_Handbook.docx', 'resident_handbook', 'residentHandbook',
   'Resident Handbook', 'handbook', '2.0', True,
   'The complete guide to life at Grace House: philosophy, eligibility, rights, phases, curfew, medication, confidentiality, grievances, and the return-to-use framework.',
   ['1.A.1 — mission and vision', '1.C.7.c — rights posted and provided', '3.G.21.a — individualized recovery planning with exit plan', '1.B.6.b — 42 CFR Part 2-aligned confidentiality', '2.F.19.c — emergency orientation'],
   ['Item 2 — family-like peer community', 'Item 4 — provider of choice', 'Item 5 — faith elements by choice, never mandated', 'Item 6 — all FDA-approved medications allowed']),
  ('GraceHouse_Fee_Schedule_and_Financial_Agreement.docx', 'fee_schedule_financial_agreement', 'feeScheduleFinancialAgreement',
   'Fee Schedule & Financial Agreement', 'agreement', '2.0', True,
   'Every cost in writing before you apply: shared $175/wk or $650/mo, single $200/wk or $700/mo — with hardship plans always available.',
   ['1.A.3.a — fees disclosed before any funds accepted', '1.A.3.b — accounting for resident financial transactions', '1.A.3.c — refund terms disclosed', '1.A.2.h — no staff involvement in resident finances'],
   ['Fee transparency before admission']),
  ('GraceHouse_Drug_and_Alcohol_Screening_Policy_and_Consent.docx', 'screening_policy_consent', 'screeningPolicyConsent',
   'Drug & Alcohol Screening Policy & Consent', 'agreement', '2.0', True,
   'Phase-based screening with dignity standards: prescription-consistent results protected, and a positive result opens the Return-to-Use Response — not automatic discharge.',
   ['2.F.16.c — drug screening and toxicology protocols'],
   ['Item 6 — prescribed MAT/MOUD recorded as prescription-consistent']),
  ('GraceHouse_Medication_and_MAT_MOUD_Policy.docx', 'medication_mat_moud_policy', 'medicationMatMoudPolicy',
   'Medication & MAT/MOUD Policy', 'agreement', '2.0', True,
   'All FDA-approved medications for SUD and mental health affirmed and supported — storage, disclosure, and prescription-consistent screening protections.',
   ['2.F.16.d — medication usage and storage policy'],
   ['Item 6 — all FDA-approved medications for SUD & MH allowed']),
  ('GraceHouse_Curfew_and_Pass_Policy_with_Request_Form.docx', 'curfew_pass_policy', 'curfewPassPolicy',
   'Curfew & Pass Policy + Request Form', 'policy', '2.0', False,
   'Phase-based curfew (GH-CURFEW-001 v3.0), employment as the only exception, and the overnight pass / furlough request process.',
   ['2.F.16.e — residents encouraged to take responsibility for safety', '3.I.27 — functionally equivalent family rhythms'],
   ['Overnight/pass procedures in writing']),
  ('GraceHouse_Return_to_Use_Response_Policy.docx', 'return_to_use_response_policy', 'returnToUseResponsePolicy',
   'Return-to-Use Response Policy', 'agreement', '2.0', True,
   'A return to use is a medical and recovery event — not a moral failure and not automatic discharge. Safety first, dignity always, individualized support.',
   ['3.G.20.a — residents encouraged and supported in recovery', '2.F.19.d — naloxone accessible'],
   ['Safe, supportive return-to-use response']),
  ('GraceHouse_Grievance_Policy_and_Form.docx', 'grievance_policy_form', 'grievancePolicyForm',
   'Grievance Procedure & Form', 'policy', '1.0', False,
   'Your right to be heard: informal resolution, formal filing with acknowledgment in 24 hours and review in 5 business days, appeal, and external agencies — with zero retaliation.',
   ['1.C.7.b — grievance policy with right to escalate'],
   ['Grievance procedure available and posted']),
  ('GraceHouse_Incident_Report_System.docx', 'incident_report_system', 'incidentReportSystem',
   'Incident Report System', 'policy', '1.0', False,
   'How safety events are documented, classified, reviewed, and learned from — a learning culture, not a punishment culture.',
   ['1.A.4.a — data collection with privacy protected'],
   ['Incident documentation and review process']),
  ('GraceHouse_Emergency_Response_Protocols.docx', 'emergency_response_protocols', 'emergencyResponseProtocols',
   'Emergency Response Protocols', 'policy', '1.0', False,
   'Step-by-step response for overdose (naloxone), medical, mental-health crisis, fire, severe weather, and safety events — posted and reviewed with every resident.',
   ['2.F.19.a — emergency numbers and evacuation maps posted', '2.F.19.c — residents oriented to emergency procedures', '2.F.19.d — naloxone accessible, individuals trained'],
   ['Fire safety and emergency procedures', 'Naloxone on site with training']),
  ('GraceHouse_Good_Neighbor_Policy.docx', 'good_neighbor_policy', 'goodNeighborPolicy',
   'Good Neighbor Policy', 'agreement', '2.0', True,
   'Among the best-kept, quietest, most considerate homes on the block — with neighbor concerns acknowledged within 24 hours and logged.',
   ['4.J.30.a — neighbor contact available', '4.J.30.b — responsive concern handling', '4.J.31.a — smoking, loitering, cleanliness courtesy', '4.J.31.b — parking courtesy'],
   ['Good neighbor policy in writing']),
  ('GraceHouse_Exit_and_Transition_Policy.docx', 'exit_transition_policy', 'exitTransitionPolicy',
   'Exit & Transition Policy', 'policy', '2.0', False,
   'Completion, voluntary exit, and administrative removal — every exit planned, documented, dignified, and with a door that stays open.',
   ['3.G.21.a — exit planning', '1.B.5 — due process and documentation'],
   ['Discharge/transition with safe-exit planning']),
  ('GraceHouse_Code_of_Ethics.docx', 'code_of_ethics', 'codeOfEthics',
   'Code of Ethics — Staff, House Leads, Peer Mentors & Volunteers', 'policy', '2.0', False,
   'The commitments every person serving Grace House signs: residents’ interests first, scope of role, boundaries, confidentiality, no exploitation.',
   ['1.A.2.i — code of ethics signed by all staff and volunteers'],
   ['Staff ethics signatures on file']),
  ('GraceHouse_Change_Course_Leaders_Policy.docx', 'change_course_leaders_policy', 'changeCourseLeadersPolicy',
   'Change Course Leaders Policy (Partner Program)', 'policy', '2.2', False,
   'Change Course is an independent partner program with Leaders only; Grace House requires CC Leaders two additional supportive activities weekly.',
   ['3.G.23.a — weekly schedule of recovery support services', 'Multiple pathways honored'],
   ['Item 5 — chosen services in lieu, never mandated']),
  ('GraceHouse_NARR_II_Self_Assessment_and_HHS_Alignment.docx', 'narr_ii_self_assessment', 'narrIiSelfAssessment',
   'NARR Level II Self-Assessment & Iowa HHS Alignment', 'policy', '2.0', False,
   'Readiness self-assessment for NARR Level II certification via MCRSP through Iowa HHS — the 7-item eligibility checklist and pre-certification punch list.',
   ['All domains — certification readiness'],
   ['Form 470-0025 items 1–7 alignment']),
  ('GraceHouse_Application_and_PreScreening_Form.docx', 'form_application_prescreening', 'applicationPrescreeningForm',
   'Application & Pre-Screening Form', 'form', '2.0', False,
   'The application for residency: applicant information, eligibility pathway (recovery or family), recovery & support, safety screening, and your goals.',
   ['1.B.5.a — applicants informed before agreement'],
   ['Item 7 — eligibility pathway documented']),
  ('GraceHouse_Intake_Forms_Package.docx', 'intake_forms_package', 'intakeFormsPackage',
   'Intake Forms Package', 'form', '1.0', False,
   'The complete intake set: screening, eligibility checklist, assessment, ROI consents, emergency contact & medical consent, communication preferences, and orientation checklist.',
   ['2.F.19.b — emergency contact collected', '1.B.6.a — records secure with authorized access', '1.A.4.a — data collection with privacy protected'],
   ['Documented intake and consent process']),
  ('GraceHouse_Complete_Operational_System_v2.docx', 'complete_operational_system', 'completeOperationalSystem',
   'Complete Operational System (Staff Manual)', 'policy', '2.0', False,
   'The eight-section master operations manual for Grace House staff and house leadership — the policy source the resident-facing documents implement.',
   ['1.D.12 — written procedures and role definitions', 'Domain 1 — administrative operations'],
   ['Operations evidence for certification']),
]

os.makedirs(OUT, exist_ok=True)
# clear old modules
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

def ts_escape(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

def ts_str(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"

imports = []
for fname, key, tsfile, name, cat, ver, sig, summary, narr, iowa in DOCS:
    blocks = extract(os.path.join(SRC, fname))
    body = render(blocks)
    varname = tsfile[0].lower() + tsfile[1:]
    mod = f"""import type {{ ResidenceDocument }} from '../types';

/**
 * GENERATED from the canonical operational document
 * source-documents/grace-house/{fname} — regenerate with
 * scripts/import-grace-house-docs (do not hand-edit the body).
 */
export const {varname}: ResidenceDocument = {{
  key: {ts_str(key)},
  name: {ts_str(name)},
  category: {ts_str(cat)},
  version: {ts_str(ver)},
  summary: {ts_str(summary)},
  requiresSignature: {'true' if sig else 'false'},
  narrReferences: [
{chr(10).join('    ' + ts_str(r) + ',' for r in narr)}
  ],
  iowaChecklist: [
{chr(10).join('    ' + ts_str(r) + ',' for r in iowa)}
  ],
  body: `{ts_escape(body)}`,
}};
"""
    open(os.path.join(OUT, tsfile + '.ts'), 'w').write(mod)
    imports.append((varname, tsfile, cat, key))
    print(f"{tsfile}.ts  <-  {fname}  ({len(body)} chars)")

# registry
order = [v for v, _, _, _ in imports]
reg = "import type { ResidenceDocument } from './types';\n"
reg += '\n'.join(f"import {{ {v} }} from './documents/{f}';" for v, f, _, _ in imports)
reg += f"""

/**
 * The complete Grace House document library — imported verbatim from the
 * canonical operational document set (v2, 2026), in the order used by the
 * application process and the app's Documents area.
 */
export const allDocuments: ResidenceDocument[] = [
{chr(10).join('  ' + v + ',' for v in order)}
];

const byKey = new Map(allDocuments.map((d) => [d.key, d]));

export function getDocument(key: string): ResidenceDocument | undefined {{
  return byKey.get(key);
}}

/** Documents every participant signs/acknowledges at intake, in order. */
export const moveInSignatureSet: ResidenceDocument[] = allDocuments.filter(
  (d) => d.requiresSignature,
);
"""
open('/home/user/GFA-ECO/packages/residence-content/src/registry.ts', 'w').write(reg)
print('registry.ts written')
