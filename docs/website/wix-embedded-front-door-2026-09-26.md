# Wix embedded RecoveryOS front door

Requested by Thomas September 26, 2026: retain Wix hosting and donation checkout while showing the latest RecoveryOS staging experience.

Production site: 5518d7be-0d95-44f4-96ba-89c21748f731. Custom embed: 5c505965-8de7-4679-9b4d-c49f8a892b83.

The versioned shell initially runs only with ?gfa-preview=1. Public activation requires changing PREVIEW_ONLY to false in that custom embed. It hides the Wix SITE_CONTAINER for mapped public paths and displays the staging /gfa site in a viewport iframe. It does not delete/unpublish Wix pages; old HTML can remain indexed. Donation, confirmation, checkout, member, group and store routes are preserved with a return-home link. Disable this single custom embed to roll back. No DNS, Wix member, payment, or database changes are required.

Preview runtime: new homepage and Contact Connect render inside the real GFA domain. Form security verification and successful accepted submission remain unverified; no test payment or participant data submitted. Existing Supabase lead-intake v15 remains active. The giving page links to existing /donate using target=_top, outside the iframe. Return links use the Wix root, which hosts RecoveryOS after activation. No forced payment-success redirect is used.

Staging now serves public visitors if activated; subsequent staging releases affect the public site. This is a reversible transition, not a fully isolated production deployment. Existing analytics tags stay untouched; iframe interactions require separate conversion instrumentation. Retained Wix records do not imply shared RecoveryOS authentication.
