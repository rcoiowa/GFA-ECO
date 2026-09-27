# Public embedded front door activation

September 26, 2026 America/Chicago. Authorized by Thomas's request to embed the latest staging experience on the live Wix site while retaining donation checkout.

Wix custom embed 5c505965-8de7-4679-9b4d-c49f8a892b83 revision 3 is active with PREVIEW_ONLY=false. Homepage and mapped legacy public pages show the new GFA experience; 42 path entries. Browser verified root, legacy /about, native Contact Connect rendering inside iframe, donation page, Wix checkout payment options, and Return to GFA navigation. No payment or personal data was submitted. Existing Wix data, member services, donation subscriptions and DNS were not altered.

Source commit 6984139a3008c7813d4fd222539b1e96bf3dc043 passed CI 36287044348 and staging deploy 36287132977, including the direct top-level donation link on /gfa/give. The shell is installed through Wix; this documentation/source-only activation record does not require a Cloudflare redeploy.

Limitations: old pages are visually replaced using custom embed CSS/JS, not deleted or unpublished. Search engines and disabled-JavaScript visitors can still encounter old HTML. App/member/store/checkout/confirmation routes remain functional outside the iframe. No shared authentication migration is implied. Contact Connect accepted submission and post-payment completion are unverified. Analytics history remains in Wix, but new iframe event/conversion continuity is unverified. Staging changes now affect the public website.

Rollback: disable only this custom embed. Re-enable to restore shell. Do not delete Wix pages, accounts or payment configuration. No other custom embeds were changed.
