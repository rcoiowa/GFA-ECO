# GFA website replacement — September 26, 2026

## Verified baseline

- Wix production site: 5518d7be-0d95-44f4-96ba-89c21748f731, published, premium custom-domain site.
- Members Query API reports 155 member records. This is a record count, not a reconciled active-member or verified-user count.
- Contact Connect form 8ce6b3ab-a69b-4ecb-9eb3-5cb188b52bb4: 122 submissions, 30 unseen (Count Submissions API). No records deleted or migrated.
- SEO API enumerated all 44 configured static page canonicals, hasNext=false. It exposes saved revision metadata, not proof that every page revision is published. Dynamic app/product/member URLs require separate review.
- Existing site uses Wix Members, Forms, Bookings, Donations, Groups and Stores. Donation page uses Wix-hosted checkout; no independent replacement payment destination verified.
- Existing lead-intake v14 source exactly matches repository baseline. CQCX leads schema includes source, submission ID, submitted_at and notes; no new migration is required for the new Contact Connect ingress.

## Implemented

- Native Contact Connect in the approved GFA presentation, no link or embedded page from the old Wix site.
- Public `/lead-intake/contact` branch uses strict origins, bounded JSON, allowlisted fields, required contact permission, required Turnstile hostname/action checks, and existing canonical lead receiver. No browser credentials, public table grant, or new operational database.
- Contact permission text/version/time/origin is recorded in lead notes; this is permission to respond only, not marketing, service enrollment, or account creation.
- Success requires the canonical receiver to accept the request. Failure preserves browser form entries for retry; no sensitive fields are placed in URLs or analytics. No new external analytics tags.
- Old donation links replaced with local giving information. This page does NOT process donations; restoring online checkout is a production gate.
- Production-host routing serves the new homepage and local static pages, with aliases covering all configured legacy static paths. Former profiles lead to human contact, old community membership pages explain the transition, and thank-you URLs do not fabricate a transaction confirmation.
- Other RecoveryOS hostnames and application routes remain unchanged. Housing links remain on the current deployment's residence-specific routes.

## Production cutover is NOT complete

1. Cloudflare dashboard remained at its bot/security verification page after one reload. Domain/zone records, current authoritative DNS, Worker binding, TLS and rollback record set have not been verified or changed. Do not infer them from a Worker deployment.
2. Existing Wix members have NOT been imported into Supabase. Preserve the existing Wix site and member records. Decide and implement continuity: retain Wix member authentication through an approved headless integration, or migrate identities with verified account activation and consent/role reconciliation. Never import elevated roles or assume exported contacts include reusable passwords.
3. Donation checkout and recurring payment relationships must be reconciled and preserved. The local giving information page is an honest fallback, not a replacement for payment conversion capability.
4. Export/retain historical Wix conversion reports, form history, contacts and consent records in a restricted destination. Baseline counts are verified; a full backup/export has NOT been performed in this work. Do not put member exports or submissions in this public repository.
5. Reinstall and consent-test approved analytics/advertising tags using the existing properties; historical records and new-site measurement are separate. No claim of continuous or identical attribution.
6. End-to-end Contact Connect receipt and authorized-staff visibility, housing submission on intended domain, existing-member sign-in, donation checkout, mail/DNS preservation, legacy app routes and mobile accessibility must pass before DNS cutover. Never bypass the security challenge to run these tests.

## Retention and rollback

Keep the existing Wix site, subscriptions and data intact through migration and reconciliation. Removing its public navigation links does not require deleting the Wix account or records. Do not cancel Wix or disconnect payment products during this change. At cutover, change only the reviewed web-serving records/bindings; preserve email MX, SPF, DKIM and DMARC. Capture previous DNS and bindings first so rollback is concrete.

## Sources

Wix GetSiteContext; Members Query; Count Submissions; List Item SEO Tags (44 entries); official Wix headless frontend/member-login guidance; official Wix contacts export and analytics export guidance; repository and live CQCX lead receiver/schema.
