'use strict';
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
  });
});
const dialog = document.getElementById('interest-dialog');
const topic = document.getElementById('interest-topic');
document.querySelectorAll('.interest-open').forEach(button => button.addEventListener('click', () => {
  topic.value = button.dataset.topic;
  dialog.showModal();
  document.body.classList.add('modal-open');
}));
document.querySelector('[data-interest]').addEventListener('click', event => {
  event.preventDefault();
  topic.value = event.currentTarget.dataset.interest;
  dialog.showModal();
  document.body.classList.add('modal-open');
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
const form = document.getElementById('interest-form');
const status = document.getElementById('form-status');
let submissionId = crypto.randomUUID();
let widgetId = null;
let verificationToken = '';
let submitting = false;
const setStatus = (text, error = false) => {
  status.textContent = text;
  status.dataset.error = String(error);
};
window.rcoTurnstileReady = () => {
  if (widgetId !== null) return;
  widgetId = window.turnstile.render('#turnstile-widget', {
    sitekey: '0x4AAAAAAFDu5DlIjHNJPMEO',
    action: 'rco_inquiry',
    callback: token => { verificationToken = token; },
    'expired-callback': () => { verificationToken = ''; },
    'error-callback': () => { verificationToken = ''; setStatus('Verification could not load. Please try again or use the contact details below.', true); }
  });
};
if (window.turnstile) window.rcoTurnstileReady();
form.addEventListener('input', () => {
  // A changed inquiry is a new request; unchanged retries keep the original key.
  if (!submitting) submissionId = crypto.randomUUID();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !form.reportValidity()) return;
  if (!verificationToken) { setStatus('Please complete the verification before sending.', true); return; }
  const payload = {
    name: document.getElementById('contact-name').value.trim(),
    email: document.getElementById('contact-email').value.trim(),
    organization: document.getElementById('organization').value.trim(),
    topic: topic.value,
    message: document.getElementById('interest-note').value.trim(),
    contact_permission: document.getElementById('contact-permission').checked,
    permission_version: 'rco-iowa-inquiry-v1',
    submission_id: submissionId,
    website: document.getElementById('contact-website').value,
    turnstile_token: verificationToken
  };
  submitting = true;
  const controls = [...form.querySelectorAll('input,select,textarea,button')];
  controls.forEach(control => { control.disabled = true; });
  setStatus('Sending your inquiry…');
  try {
    const response = await fetch('https://cqcxvwoukyhxyokfwnjm.supabase.co/functions/v1/lead-intake/rco-iowa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000)
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error('submission_failed');
    form.reset();
    submissionId = crypto.randomUUID();
    setStatus('Your inquiry was received. The founding coordinator can now review it and respond using the email you provided.');
  } catch {
    setStatus('We could not confirm receipt. Your details are still here. Please retry or contact us directly below.', true);
  } finally {
    submitting = false;
    controls.forEach(control => { control.disabled = false; });
    verificationToken = '';
    if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
  }
});
