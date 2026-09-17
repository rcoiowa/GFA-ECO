> **Historical terminology notice (2026-09-13):** "Companion"-based Grace labels and identifiers below are preserved as dated evidence. The current canonical identity is **Grace — AI Support Navigator** (`docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`).

# Source Build Route Registry

Routes/pages inventoried from cloned source (`source-builds/`), 2026-07-29.
Canonical routes live in `docs/architecture/route-registry.md`.

## vrcc.app (`vrcc-current`) — Base44 legacy pages + MVP module

**MVP module (`src/mvp/`)** — the newer, Supabase-backed core: Landing, SignIn, Intake,
ParticipantApp, CoachApp, Barc10, Messaging, SupportNow.
Recommendation: **MERGE** — this is the closest ancestor of the canonical build; its
workflows (intake, BARC-10, Support Now) map directly onto canonical engines.

**Legacy Base44 pages (~60)**: AdminDashboard, AdminPortal, Assessment,
BeePurpleReporting, CoachDashboard, CoachingLogger, Community, CommunityForum,
CommunityWalls, Crisis, DailyReflection, DigitalEquity, DocumentOCR, Events,
Gamification, GovDashPortal, GraceChat, GraceHouseManagement, GracePorchGatherings,
GrantWriter, GroupSessions, Home, IBHRSReporting, IntakeCoordinatorDashboard, MRCCHub,
ManageSessions, MeetingManagement, MeetingsHub, MyGFAPlan, MyPathway, MyServicePortal,
NarcanTracker, NavigatorDashboard, Neuroplasticity, ParticipantDashboard,
PeerCoachAnalytics, PeerCoachTraining, PeerCoachingDetail, PeerMatching,
ProviderAnalytics, ProviderHub, Quizzes, RecoveryCapitalCafe, RecoveryGarden,
Residencies, ResourceModeration, ResourceNavigatorDashboard, Resources,
SchoolPrevention, ServiceCoordinationHub, SessionSummary, StaffOnboarding, StaffSOPs,
TeamChallenges, VRCCDetail, VRCheckoutHub, VideoLibrary, VolunteerDashboard,
VolunteerHub, WorkforceDevelopment.
Recommendation: **REFERENCE ONLY / ARCHIVE** as a set — this is the "37 things you can
click" fragmentation the canonical IA replaces. Individual concepts (reflection,
meetings, peer matching, video library, reporting) re-enter through feature governance
one at a time, mapped to the seven-area navigation.

## Recovery Residence OS — React 19 + TS

| Route                  | Purpose                | User     | Recommendation                                    |
| ---------------------- | ---------------------- | -------- | ------------------------------------------------- |
| `/`                    | Entry                  | public   | MERGE into canonical `/`                          |
| `/signin`              | Auth                   | public   | MERGE (canonical auth)                            |
| `/resident`            | Resident home          | resident | **MERGE** into `/residence`                       |
| `/resident/checkin`    | Resident check-in      | resident | MERGE → shared check-in engine, residence context |
| `/resident/documents`  | Documents & signatures | resident | **PRESERVE** → `/residence/documents`             |
| `/resident/passes`     | Pass requests          | resident | **PRESERVE** → `/residence` (Phase 5)             |
| `/resident/grievance`  | Grievance filing       | resident | **PRESERVE** → `/residence`                       |
| `/staff`               | Staff dashboard        | staff    | **PRESERVE** → `/staff` (Phase 7)                 |
| `/staff/beds`          | Bed management         | staff    | PRESERVE → `/staff`                               |
| `/staff/waitlist`      | Waitlist               | staff    | PRESERVE → `/staff`                               |
| `/staff/passes`        | Pass approvals         | staff    | PRESERVE → `/staff`                               |
| `/staff/grievances`    | Grievance handling     | staff    | PRESERVE → `/staff`                               |
| `/staff/payments`      | Fee ledger             | staff    | PRESERVE → `/staff` (policy review req.)          |
| `/admin/new-residence` | Residence onboarding   | admin    | PRESERVE → `/admin`                               |

This build also carries the strongest data model work (`gfa_residence` schema, policy
engine, document/signature infrastructure, NARR/Iowa HHS compliance evidence).

## Grace House (`grace-harbor-16`) — Lovable React + TS

Pages: Index, About, Services, Community, CommunitySpaces, Contact, GraceCompanion,
WallsOfHonor, NotFound.
Recommendation: **PRESERVE CONTENT, REBUILD EXPERIENCE** → public
`/recovery-residences/grace-house`; GraceCompanion and WallsOfHonor feed the shared
Grace AI and Walls of Honor engines. Its separate Supabase project is a Phase 8
migration source.

## GFA Connection (`contact-connect-dashboard`) — Base44-style React

Pages (31): AccountApprovals, AddParticipant, Affirmations, BARC10, CheckIns,
CoachTraining, CommunityResources, CommunityRooms, Connector, DailyCheckIn, Dashboard,
EditProgressReview, EventsWall, GoalsMilestones, GroupSessions, Intake, Interactions,
NarcanTracking, NewInteraction, ParticipantDetail, Participants, ProgressReviews,
RecoveryCapitalPage, RecoveryResidences, RecoveryTracker, Referrals, Reports,
ResidenceApply, StaffOperations, StrengthQuizzes, Surveys, WallsOfHonor.
Recommendation: **MERGE** the strongest engines (DailyCheckIn, BARC10, GoalsMilestones,
Referrals, WallsOfHonor, ResidenceApply); **REFERENCE ONLY** for the virtual-building
experiential layer (lobby / hallway / rooms / basement / garden / Des Moines
neighborhood / front desk / kiosk) which becomes an optional orientation layer, not the
primary navigation.
