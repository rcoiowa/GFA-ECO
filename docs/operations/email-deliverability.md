# Email deliverability — why Supabase flagged you, and the fix

## What happened

Supabase's built-in email service is a shared, rate-limited courtesy service
(≈2 emails/hour) intended only for development. Sign-up confirmations sent to
mistyped or test addresses **bounce**, and enough bounces put the project's email
sending privileges at risk — that's the warning you received. (Test signups during
early validation contributed; current demo accounts are created without sending
email, and that practice continues.)

## The fix: authenticate your own sending domain (one-time, ~30 min)

Yes — this is the one place you authenticate outside Supabase:

1. **Pick a provider** (decision queue): Resend or Postmark are both good;
   nonprofit-friendly pricing, simple dashboards.
2. In the provider: **add the domain `vrcc.app`** and choose a sending address,
   e.g. `no-reply@vrcc.app`. The provider shows 3–4 DNS records (SPF, DKIM,
   optionally DMARC/return-path).
3. In **Cloudflare → vrcc.app → DNS**: add those records exactly as shown, then
   click Verify in the provider.
4. In the provider: create an **SMTP username/password** (or API-SMTP credentials).
5. In **Supabase → Project Settings → Authentication → SMTP Settings**: enable
   custom SMTP, paste host/port/username/password, set sender to
   `no-reply@vrcc.app`, save.
6. In **Supabase → Authentication → Rate Limits**: raise the email rate limit to a
   sane production value once custom SMTP is active.

After this, confirmation/reset emails send from your own authenticated domain,
bounces stop counting against Supabase, and the at-risk flag resolves itself.

## Until then

- Don't test sign-up with fake addresses — every bounce feeds the flag.
- Demo/test accounts are created directly in the database (no email sent).
- Auth email templates (confirm, reset, invite) should be branded when SMTP lands —
  tracked in the launch checklist.
