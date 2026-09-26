document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-button');
const navigation = document.querySelector('#main-nav');
if (toggle && navigation) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('open', open);
    toggle.textContent = open ? 'Close' : 'Menu';
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      toggle.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('open');
      toggle.textContent = 'Menu';
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.click(); toggle.focus();
    }
  });
}
document.querySelectorAll('[data-current-year]').forEach((el) => {
  el.textContent = new Intl.DateTimeFormat('en', {year:'numeric', timeZone:'America/Chicago'}).format(new Date());
});
