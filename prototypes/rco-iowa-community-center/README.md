# Iowa’s Recovery Community Center — RCO Iowa prototype

Standalone HTML/CSS/JavaScript design prototype for review, founded and operated by Grace For Addictions and powered by RecoveryOS. This is not an integrated or deployed RecoveryOS feature.

## Run

Open `index.html` in a browser, or from this folder run:

```sh
python3 -m http.server 8080
```

Then visit http://localhost:8080. No install, build, credentials, or backend is required. Keep the assets folder beside index.html. GitHub displays source rather than running the HTML; download/clone the branch to use it.

## Files

- `index.html`: page structure and prototype copy.
- `styles.css`: responsive design, shared RecoveryOS font stack and purple actions.
- `app.js`: screen navigation, kiosk search, temporary plan, account preview, and circle-log demonstration.
- `assets/original_lobby.png`: original AI-generated architectural concept, not an existing facility photograph.
- `assets/rco-iowa-logo.jpg`: RCO Iowa logo supplied by Thomas.
- `VISION.md`: subsequent statewide direction and implementation boundaries.

## Included journeys

Front door → lobby → front desk / kiosk / recovery circles / quiet corner. Kiosk search and access filters; temporary plan; illustrative account flow; staff circle-log review and demo receipt.

All account, callback, meeting-log and saved-plan operations are demonstrations. Temporary state stays in memory. Phone and SMS links may open the device’s real calling/messaging application. No authentication, database writes, email delivery, analytics, or partner integration is provided.

The capability review embedded in the prototype is dated October 2, 2026. It is historical inspection evidence, not a claim about today’s deployed software. The sample circle record is a user-provided historical example; it is not submitted by this prototype.

## Integration direction — requires separate implementation

Use the canonical React/TypeScript app, shared components/tokens, routing, consent and authorized backend workflows when integrating. The standalone JavaScript is interaction reference, not an authentication or permission implementation. Staff demonstrations must become a separate authorized workspace, never a public kiosk permission path.

The user identified `recoveryos-staging` as the active production Worker despite its name. Existing .center deployment intent remains attached to that Worker. Proposed RCOIowa.org public-home routing requires a separately reviewed domain change. This folder is outside the platform build and does not configure hosting or deployment. Do not merge or deploy as a substitute for production integration.

## Asset provenance

The internet desk/lobby screenshots supplied as inspiration were removed. Only the newly generated lobby concept and the supplied RCO Iowa logo are included. The repository’s applicable ownership and use terms remain controlling; no new license is granted here.
