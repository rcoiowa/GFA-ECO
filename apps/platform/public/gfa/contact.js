const form = document.querySelector('#contact-connect');
const status = document.querySelector('#form-status');
const submit = form.querySelector('button[type="submit"]');
let widget;
let contactEndpoint;
let submissionId = crypto.randomUUID();
const show = (text) => {
  status.textContent = text;
};
window.contactChallengeReady = async () => {
  try {
    const response = await fetch('/gfa/contact-config.json');
    if (!response.ok) throw new Error();
    const config = await response.json();
    if (!config.siteKey || !config.contactEndpoint) throw new Error();
    contactEndpoint = config.contactEndpoint;
    widget = window.turnstile.render('#contact-challenge', {
      sitekey: config.siteKey,
      action: 'contact_connect',
      callback: () => {
        submit.disabled = false;
        show('Ready to send.');
      },
      'expired-callback': () => {
        submit.disabled = true;
        show('Please complete the security check again.');
      },
      'error-callback': () => {
        submit.disabled = true;
        show(
          'The security check is unavailable. Please call 515-220-8771 or email connect@graceforaddictions.org.',
        );
      },
    });
  } catch {
    show(
      'Online submission is unavailable right now. Please call 515-220-8771 or email connect@graceforaddictions.org.',
    );
  }
};
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled || !form.reportValidity()) return;
  const data = new FormData(form);
  if (!String(data.get('email')).trim() && !String(data.get('phone')).trim()) {
    show('Please provide an email address or phone number so we can contact you.');
    form.elements.email.focus();
    return;
  }
  submit.disabled = true;
  submit.textContent = 'Sending…';
  form.setAttribute('aria-busy', 'true');
  show('Sending your request. Please keep this page open.');
  try {
    const response = await fetch(
      contactEndpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          interest: data.get('interest'),
          message: data.get('message'),
          website: data.get('website'),
          contact_permission: data.get('contact_permission') === 'on',
          submission_id: submissionId,
          turnstile_token: window.turnstile.getResponse(widget),
        }),
      },
    );
    const result = await response.json();
    if (!response.ok || result.ok !== true || result.code !== 'received') throw new Error();
    form.reset();
    submissionId = crypto.randomUUID();
    show(
      'Your request was received. Thank you for connecting with GFA. Our team will review it and use the contact information you provided. Response times vary. If you need immediate support, use the support options on this page.',
    );
  } catch {
    show(
      'We could not confirm receipt. Your entries are still here. Please retry the security check and send again, or call 515-220-8771.',
    );
  } finally {
    form.removeAttribute('aria-busy');
    submit.textContent = 'Send my request';
    window.turnstile.reset(widget);
    status.focus();
  }
});
const challenge = document.createElement('script');
challenge.src =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=contactChallengeReady&render=explicit';
challenge.async = true;
challenge.onerror = () =>
  show(
    'Online submission is unavailable. Please call 515-220-8771 or email connect@graceforaddictions.org.',
  );
document.head.append(challenge);

setTimeout(() => {
  if (submit.disabled && !form.hasAttribute('aria-busy'))
    show(
      'The security check has not completed. You can wait, reload this page, or call 515-220-8771. Your request has not been sent.',
    );
}, 20000);
