import { test, expect, FIXTURES, signIn, signOut, registerUser, classifyAsFixture } from './helpers';

/**
 * B5B ACTIVATION GATE SPEC — PREPARED, NOT RUNNABLE UNTIL ACTIVATION.
 *
 * The full intake browser sequence for the document-activation gate:
 *   conditional acceptance → participant intake → applicable documents →
 *   acknowledgments → exact Agreement signature → medication status →
 *   screening consent → readiness complete → staff admission →
 *   residency created → immutable evidence verified.
 *
 * DOUBLE-GATED on purpose: beyond the usual live gate
 * (RECOVERYOS_E2E_LIVE=1 + supabase egress) it also requires
 * RECOVERYOS_E2E_B5B=1, which is set ONLY once the signing-activation gate is
 * open (document editions ratified and seeded, signing-method review done).
 * Until then every test here self-skips — this file exists so the activation
 * gate runs a rehearsed sequence, not an improvised one.
 *
 * Fixture-only, always: fresh identities via FIXTURES.fresh(), classified
 * test_fixture, at a residence whose document edition is ACTIVE (Grace House
 * today; EJWRH after its activation seed). NEVER real participants.
 */

const B5B = process.env.RECOVERYOS_E2E_B5B === '1';

test.describe('B5B intake activation gate (prepared)', () => {
  test.skip(!B5B, 'PREPARED — runs only at the B5B signing-activation gate (RECOVERYOS_E2E_B5B=1)');

  test('full intake chain: acceptance → documents → consent → readiness → admission → evidence', async ({
    page,
    browser,
  }) => {
    // 1. Conditional acceptance: staff works the intake queue to account_offered.
    await signIn(page, FIXTURES.residenceStaff);
    await page.goto('/staff/intake');
    // (Fixture intake row is seeded by the runbook before this spec.)
    await page.getByRole('button', { name: 'Mark contacted' }).first().click();
    await page.getByRole('button', { name: 'Account offered' }).first().click();

    // 2. Participant signs up fresh and reaches Getting settled.
    const participantPage = await (await browser.newContext()).newPage();
    const email = FIXTURES.fresh('b5b-applicant');
    await registerUser(participantPage, email);
    await classifyAsFixture(email);

    // 3. Staff converts the intake to the canonical application and approves it.
    await page.getByRole('button', { name: 'Create full application…' }).first().click();
    await page.getByLabel(/search by the email/i).fill(email);
    await page.getByRole('button', { name: 'Find' }).click();
    await page.getByRole('button', { name: 'This is them' }).click();
    await page.goto('/staff/applications');
    await page.getByRole('button', { name: 'Approve' }).first().click();

    // 4. Participant intake: applicable documents render from pinned versions.
    await participantPage.goto('/app/getting-settled');
    await expect(participantPage.getByText(/You're approved/)).toBeVisible();

    // 5. Acknowledgments: each ack-only document is one tap.
    while (await participantPage.getByRole('button', { name: 'Read it' }).count()) {
      await participantPage.getByRole('button', { name: 'Read it' }).first().click();
      await participantPage.getByRole('button', { name: "I've read this" }).click();
    }

    // 6. The exact Agreement signature: typed name on the pinned version.
    await participantPage.getByRole('button', { name: 'Read & sign' }).first().click();
    await participantPage.getByLabel(/Type your full name/).fill('B5B Fixture Applicant');
    await participantPage.getByRole('button', { name: /^Sign the / }).click();

    // 7. Screening consent: the participant's own one-tap grant.
    await participantPage.getByRole('button', { name: 'I give my okay for screening' }).click();
    await expect(participantPage.getByText('Screening consent: given. ✓')).toBeVisible();

    // 8. Staff completes the staff-side items: emergency contact + medication status.
    await page.goto('/staff/applications');
    await page.getByRole('button', { name: 'Add emergency contact' }).click();
    await page.getByLabel('Emergency contact name').fill('B5B Fixture Sister');
    await page.getByLabel('Phone').fill('515-555-0100');
    await page.getByRole('button', { name: 'Save emergency contact' }).click();
    await page.getByRole('button', { name: 'No current medications' }).click();
    await expect(page.getByText('Reviewed — no current medications').first()).toBeVisible();

    // 9. Readiness complete → deliberate manager admission.
    await signOut(page);
    await signIn(page, FIXTURES.residenceManager);
    await page.goto('/staff/applications');
    await page.getByRole('button', { name: /^Move .* in$/ }).click();
    await expect(page.getByText(/is moved in/)).toBeVisible();

    // 10. Residency created: the person appears on the roster.
    await page.goto('/staff/residents');
    await expect(page.getByText('B5B Fixture Applicant')).toBeVisible();

    // 11. Immutable evidence: the signed document shows its recorded signature
    //     (version + hash + audit are asserted database-side by the runbook's
    //     post-run SQL check; the UI assertion here is the signed state).
    await participantPage.goto('/app/getting-settled');
    await expect(participantPage.getByText(/Signed/).first()).toBeVisible();
  });
});
