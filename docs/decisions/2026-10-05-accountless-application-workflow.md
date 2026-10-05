# Accountless housing application workflow

Thomas directed on October 5, 2026 that staff must move a new application forward without requiring the applicant to create an account. This supersedes the account-first conversion assumption in 0142/B5A. The canonical identity schema already distinguishes a person from a login.

The intake queue now offers full application creation for every open intake status. Staff enter verified first/last names and explicitly confirm identity. A narrow audited RPC creates a person with null auth_user_id, unverified contact methods copied from the intake, and the canonical application through the existing conversion function. It creates no auth user, invitation, consent evidence, role grant, residency, or automatic approval. Existing review/readiness/admission gates remain unchanged.

Same-intake retries return the existing application. Matching account email, contact email/phone, or exact first/last name stops new-person creation for deliberate identity review; no silent merging. Existing account conversion remains available. A later optional login-linking workflow is separate; signup must not be used to bypass identity review.

Verified with rolled-back CQCX synthetic fixtures: creation, review progression, no auth user creation, explicit confirmation, idempotence, and denied anonymous execution. Frontend regression covers confirmation before creation.
