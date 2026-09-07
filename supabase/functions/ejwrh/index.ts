// ejwrh — Ernest & Johnnie White Recovery House public application portal (Gate A rebuild).
//
// Replaces the storage-proxied v1 page (contained by 0138: bucket private, anon write path
// dropped). This function is SELF-CONTAINED: the page is inline UTF-8 source — no storage
// dependency, no mutable artifact, version-controlled in the repo.
//
// Gate A scope (predeployment audit 2026-08-23 + Gate A remediation directive):
//   * APPLICATION stage only — the ratified lifecycle is
//     Discover → Apply → Review → Conditional acceptance → Intake → Admission.
//     No resident documents, no ROI, no medication/SUD/medical/legal detail, no emergency
//     contacts, no signature instrument. Those are intake-stage (Gate B, not built).
//   * Data-minimized application contract (see APPLICATION-STAGE DATA CONTRACT below).
//   * Submission goes EXCLUSIVELY through the canonical residence-intake Edge Function
//     (service-role boundary → recoveryos.residence_application_intake → staff queue,
//     notifications, audited review). There is NO direct PostgREST write on this page.
//   * Content uses only governance-verified support contacts (supportContacts canon) and
//     the canonical NARR status (Level II certification in preparation via MCRSP — seed
//     0200). Operational-policy language not reconciled to authoritative house documents
//     is NOT published here.
//   * This Supabase URL is NOT the public production address. Cloudflare deployment
//     remains CLOSED; the prepared (unactivated) route is recoveryresidence.org/ejwrh.
//
// SUBMISSION MAPPING RECONCILIATION (2026-09-07): this page's inline form posts
// kind 'residence_application' (canonical since the same-day residence-intake
// reconciliation; 'grace_house_application' remains the accepted legacy alias) hard
// bound to residence_id 2 (EJWRH). NOTE the deployed reality recorded by the R1
// front-door work: residence-intake rejects submissions whose Origin is not
// allowlisted, and this page is served from the Supabase functions origin, which is
// deliberately NOT allowlisted — so the WORKING public application path for both
// houses is the recoveryresidence.org directory form (bound residence forms posting
// to residence-intake); this page's phone/email fallback always works. Redeploy
// ordering if this page is ever promoted: residence-intake (which accepts the
// canonical kind) deploys BEFORE this page.
//
// APPLICATION-STAGE DATA CONTRACT (everything this page may collect — nothing else):
//   canonical columns: applicant_name (required); applicant_email and/or applicant_phone
//     (at least one required); preferred_contact ('phone'|'text'|'email');
//     referral_source (optional); consent_to_contact (required checkbox);
//     residence_id = 2 (EJWRH, canonical seed); source = 'ejwrh-portal'.
//   bounded answers{} (short strings, no narratives):
//     age_18_plus ('yes' — required eligibility attestation, no DOB),
//     county (optional), housing_situation (optional, one line),
//     why_ejwrh (optional, a sentence or two), accommodation_needs (optional, high level),
//     supervision_coordination ('yes'|'no'|'unsure' — flag only, no officer/case detail),
//     voicemail_ok ('yes'|'no' — safe-contact), timing ('now'|'soon'|'exploring').
//   plus the honeypot field (never stored).

const INTAKE_URL = "https://cqcxvwoukyhxyokfwnjm.supabase.co/functions/v1/residence-intake";
const EJWRH_RESIDENCE_ID = 2;

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ernest &amp; Johnnie White Recovery House — Apply</title>
<style>
  :root { --ink:#232323; --muted:#5c5c56; --line:#e2ddd3; --bg:#faf7f1; --card:#ffffff;
          --accent:#2f5d50; --accent-ink:#ffffff; --soft:#eef2ee; --warn:#8a4b2d; }
  * { box-sizing:border-box; margin:0; }
  body { font:16px/1.6 Georgia, 'Times New Roman', serif; color:var(--ink);
         background:var(--bg); padding:0 0 4rem; }
  header, main { max-width:44rem; margin:0 auto; padding:0 1.25rem; }
  header { padding-top:2.5rem; }
  .kicker { font-family:system-ui, sans-serif; font-size:.78rem; letter-spacing:.14em;
            text-transform:uppercase; color:var(--accent); }
  h1 { font-size:1.9rem; line-height:1.25; margin:.35rem 0 .6rem; }
  h2 { font-size:1.25rem; margin:0 0 .5rem; }
  .lede, p { color:var(--ink); }
  .muted { color:var(--muted); font-size:.95rem; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px;
          padding:1.4rem 1.5rem; margin:1.25rem 0; }
  .crisis { background:var(--soft); border-color:#cfdcd2; }
  .crisis ul { list-style:none; padding:0; margin:.4rem 0 0; }
  .crisis li { padding:.3rem 0; border-bottom:1px solid #dbe5dd; }
  .crisis li:last-child { border-bottom:none; }
  .crisis a { color:var(--accent); font-weight:bold; text-decoration:none; }
  label { display:block; font-family:system-ui, sans-serif; font-size:.9rem;
          font-weight:600; margin:1rem 0 .25rem; }
  .opt { font-weight:400; color:var(--muted); }
  input[type=text], input[type=email], input[type=tel], select, textarea {
    width:100%; padding:.6rem .7rem; font:inherit; border:1px solid var(--line);
    border-radius:8px; background:#fff; color:var(--ink); }
  textarea { min-height:4.2rem; resize:vertical; }
  .check { display:flex; gap:.6rem; align-items:flex-start; margin:1rem 0; }
  .check input { margin-top:.3rem; width:1.05rem; height:1.05rem; }
  .check span { font-family:system-ui, sans-serif; font-size:.95rem; }
  button { font:600 1rem system-ui, sans-serif; background:var(--accent);
           color:var(--accent-ink); border:0; border-radius:8px; padding:.8rem 1.6rem;
           margin-top:1.25rem; cursor:pointer; }
  button[disabled] { opacity:.6; cursor:default; }
  .notice { border-radius:8px; padding:.9rem 1rem; margin-top:1rem;
            font-family:system-ui, sans-serif; font-size:.95rem; display:none; }
  .notice.ok { display:block; background:#eaf3ec; border:1px solid #b9d4bf; }
  .notice.err { display:block; background:#f7ece4; border:1px solid #dcc0ab; color:var(--warn); }
  .hp { position:absolute; left:-5000px; top:-5000px; }
  footer { max-width:44rem; margin:2.5rem auto 0; padding:1.25rem;
           border-top:1px solid var(--line); color:var(--muted); font-size:.88rem; }
  ol.path { margin:.4rem 0 0 1.1rem; }
  ol.path li { margin:.25rem 0; }
</style>
</head>
<body>
<header>
  <p class="kicker">Grace For Addictions · Des Moines, Iowa</p>
  <h1>Ernest &amp; Johnnie White Recovery House</h1>
  <p class="lede">A peer-supported men&rsquo;s recovery residence operating toward NARR
  Level&nbsp;II standards, with wraparound recovery support from Grace For Addictions.
  All recovery pathways are honored, and residents on prescribed MAT/MOUD are welcome.
  No shame. No stigma. Just grace.</p>
</header>
<main>
  <section class="card crisis" aria-label="Immediate support">
    <h2>If you need support right now</h2>
    <ul>
      <li><strong>Emergency:</strong> call <a href="tel:911">911</a>.
        Iowa law provides certain protections related to seeking medical assistance for a
        drug-related overdose; those protections have specific legal conditions and limits.
        In an emergency, call 911.</li>
      <li><strong>988 Suicide &amp; Crisis Lifeline:</strong> call or text
        <a href="tel:988">988</a>, any time.</li>
      <li><strong>Iowa Warm Line</strong> (peer listening — not a crisis line):
        <a href="tel:18447759276">844-775-9276</a>.</li>
      <li><strong>GFA Warmline:</strong> <a href="tel:15153103425">(515) 310-3425</a>.</li>
    </ul>
  </section>

  <section class="card">
    <h2>How applying works</h2>
    <ol class="path">
      <li><strong>Apply</strong> — the short form below. A few minutes, no documents needed.</li>
      <li><strong>We review</strong> — a real person reads every application.</li>
      <li><strong>We reach out</strong> — using the contact method you choose.</li>
      <li><strong>Intake together</strong> — if it&rsquo;s a fit, the details (house
        expectations, agreements, any releases) happen with staff, at your pace, before
        move-in. Nothing is signed today.</li>
    </ol>
  </section>

  <section class="card">
    <h2>Apply to EJWRH</h2>
    <p class="muted">Only what&rsquo;s needed to start the conversation. Your information is
    handled according to GFA privacy, consent, and access-control policies and is limited to
    people authorized to support the intake process.</p>
    <form id="apply" novalidate>
      <div class="hp" aria-hidden="true">
        <label for="company_website">Company website</label>
        <input type="text" id="company_website" name="company_website" tabindex="-1" autocomplete="off">
      </div>

      <label for="name">Your name <span class="opt">(required)</span></label>
      <input type="text" id="name" name="name" required maxlength="200" autocomplete="name">

      <label for="phone">Phone <span class="opt">(this or email — at least one)</span></label>
      <input type="tel" id="phone" name="phone" maxlength="40" autocomplete="tel">

      <label for="email">Email <span class="opt">(this or phone — at least one)</span></label>
      <input type="email" id="email" name="email" maxlength="320" autocomplete="email">

      <label for="preferred_contact">Best way to reach you</label>
      <select id="preferred_contact" name="preferred_contact">
        <option value="phone">Call me</option>
        <option value="text">Text me</option>
        <option value="email">Email me</option>
      </select>

      <label for="voicemail_ok">Is it safe to leave a voicemail or text?</label>
      <select id="voicemail_ok" name="voicemail_ok">
        <option value="">Prefer not to say</option>
        <option value="yes">Yes</option>
        <option value="no">No — please only speak with me directly</option>
      </select>

      <div class="check">
        <input type="checkbox" id="age18" name="age18" required>
        <span>I am 18 or older. <span class="opt">(required)</span></span>
      </div>

      <label for="county">County you&rsquo;re in now <span class="opt">(optional)</span></label>
      <input type="text" id="county" name="county" maxlength="120">

      <label for="housing_situation">Your housing situation right now
        <span class="opt">(optional — one line is plenty)</span></label>
      <input type="text" id="housing_situation" name="housing_situation" maxlength="300">

      <label for="timing">When are you hoping to move in?</label>
      <select id="timing" name="timing">
        <option value="">Not sure yet</option>
        <option value="now">As soon as possible</option>
        <option value="soon">In the next month or so</option>
        <option value="exploring">Just exploring for now</option>
      </select>

      <label for="why_ejwrh">Anything you&rsquo;d like us to know about why EJWRH?
        <span class="opt">(optional — a sentence or two)</span></label>
      <textarea id="why_ejwrh" name="why_ejwrh" maxlength="600"></textarea>

      <label for="accommodation_needs">Any accessibility or accommodation needs we should
        plan for? <span class="opt">(optional, high level — details can wait for intake)</span></label>
      <input type="text" id="accommodation_needs" name="accommodation_needs" maxlength="300">

      <label for="supervision_coordination">Would you want us to coordinate with probation,
        parole, or reentry staff? <span class="opt">(just a yes/no for now — no details
        needed today)</span></label>
      <select id="supervision_coordination" name="supervision_coordination">
        <option value="">Prefer not to say</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
        <option value="unsure">Not sure</option>
      </select>

      <label for="referral_source">How did you hear about us? <span class="opt">(optional)</span></label>
      <input type="text" id="referral_source" name="referral_source" maxlength="200">

      <div class="check">
        <input type="checkbox" id="consent" name="consent" required>
        <span>I agree that Grace For Addictions may process this application and contact me
        about it using the method I chose above. <span class="opt">(required)</span></span>
      </div>

      <button type="submit" id="submitBtn">Send my application</button>
      <div class="notice ok" id="okNotice" role="status">
        <strong>We received your application.</strong> A member of our team will reach out
        using the contact method you chose. If anything changes, call
        <a href="tel:15152208771">(515) 220-8771</a>.
      </div>
      <div class="notice err" id="errNotice" role="alert">
        <strong>We couldn&rsquo;t send that just now &mdash; but you&rsquo;re not stuck.</strong>
        Call <a href="tel:15152208771">(515) 220-8771</a> or email
        <a href="mailto:ejwrh@rcoiowa.org">ejwrh@rcoiowa.org</a> and we&rsquo;ll take your
        application by phone. What you typed stays here so you can try again.
      </div>
    </form>
  </section>
</main>
<footer>
  <p>Ernest &amp; Johnnie White Recovery House · 1414 12th Street, Des Moines, IA 50314 ·
  <a href="tel:15152208771">(515) 220-8771</a> ·
  <a href="mailto:ejwrh@rcoiowa.org">ejwrh@rcoiowa.org</a></p>
  <p>A program of Grace For Addictions, a 501(c)(3) nonprofit Recovery Community
  Organization. Operating toward NARR Level&nbsp;II standards (certification in preparation
  via MCRSP through the Iowa HHS process).</p>
</footer>
<script>
(function () {
  var form = document.getElementById('apply');
  var btn = document.getElementById('submitBtn');
  var ok = document.getElementById('okNotice');
  var err = document.getElementById('errNotice');
  var v = function (id) { return (document.getElementById(id).value || '').trim(); };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ok.classList.remove('ok'); err.classList.remove('err');
    if (!v('name') || (!v('phone') && !v('email'))
        || !document.getElementById('age18').checked
        || !document.getElementById('consent').checked) {
      err.classList.add('err');
      err.innerHTML = '<strong>Almost there.</strong> We need your name, at least one way to '
        + 'reach you, and the two checkboxes. Everything else is optional.';
      return;
    }
    var answers = {};
    answers.age_18_plus = 'yes';
    if (v('county')) answers.county = v('county');
    if (v('housing_situation')) answers.housing_situation = v('housing_situation');
    if (v('timing')) answers.timing = v('timing');
    if (v('why_ejwrh')) answers.why_ejwrh = v('why_ejwrh');
    if (v('accommodation_needs')) answers.accommodation_needs = v('accommodation_needs');
    if (v('supervision_coordination')) answers.supervision_coordination = v('supervision_coordination');
    if (v('voicemail_ok')) answers.voicemail_ok = v('voicemail_ok');

    btn.disabled = true; btn.textContent = 'Sending…';
    fetch('${INTAKE_URL}', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'residence_application',
        residence_id: ${EJWRH_RESIDENCE_ID},
        applicant_name: v('name'),
        applicant_email: v('email') || null,
        applicant_phone: v('phone') || null,
        preferred_contact: v('preferred_contact'),
        referral_source: v('referral_source') || null,
        consent_to_contact: true,
        company_website: v('company_website'),
        answers: answers,
        source: 'ejwrh-portal'
      })
    }).then(function (res) { return res.json().catch(function () { return {}; }).then(function (body) {
      if (res.ok && body && body.ok) {
        form.querySelectorAll('input, select, textarea, button').forEach(function (el) { el.disabled = true; });
        ok.classList.add('ok');
      } else {
        btn.disabled = false; btn.textContent = 'Send my application';
        err.classList.add('err');
      }
    }); }).catch(function () {
      btn.disabled = false; btn.textContent = 'Send my application';
      err.classList.add('err');
    });
  });
})();
</script>
</body>
</html>`;

Deno.serve((req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  return new Response(req.method === "HEAD" ? null : PAGE, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; " +
        "connect-src https://cqcxvwoukyhxyokfwnjm.supabase.co; base-uri 'none'; " +
        "form-action 'none'; frame-ancestors 'none'",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
});
