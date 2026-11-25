const root = document.documentElement;
const english = root.lang === 'en';
const viewButtons = document.querySelectorAll('[data-view-choice]');
const lightButton = document.querySelector('[data-light-switch]');

function remembered(key) {
  try { return localStorage.getItem('cloudsdale-' + key); } catch { return null; }
}

function remember(key, value) {
  try { localStorage.setItem('cloudsdale-' + key, value); } catch { /* Private browsing */ }
}

function showView(value) {
  root.dataset.view = value === 'journal' ? 'journal' : 'scene';
  for (const button of viewButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.viewChoice === root.dataset.view));
  }
}

function setLight(value) {
  const night = value === 'night';
  root.dataset.light = night ? 'night' : 'day';
  lightButton.setAttribute('aria-pressed', String(night));
  lightButton.setAttribute('aria-label', english ? 'Night scene' : '夜景模式');
  lightButton.querySelector('[data-light-text]').textContent = english ? 'Night' : '夜景';
}

showView(remembered('view'));
setLight(remembered('light'));
for (const button of viewButtons) {
  button.addEventListener('click', () => {
    showView(button.dataset.viewChoice);
    remember('view', root.dataset.view);
  });
}
lightButton.addEventListener('click', () => {
  setLight(root.dataset.light === 'day' ? 'night' : 'day');
  remember('light', root.dataset.light);
});

for (const link of document.querySelectorAll('a[data-open]')) {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const dialog = document.getElementById(link.dataset.open);
    if (typeof dialog?.showModal !== 'function') return;
    event.preventDefault();
    dialog.showModal();
  });
}

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
}

const album = document.getElementById('album');
const slides = [...album.querySelectorAll('[data-slide]')];
let current = 0;
function turnPage(step) {
  slides[current].hidden = true;
  current = (current + step + slides.length) % slides.length;
  slides[current].hidden = false;
  album.querySelector('output').textContent = (current + 1) + ' / ' + slides.length;
}
for (const button of album.querySelectorAll('[data-step]')) {
  button.addEventListener('click', () => turnPage(Number(button.dataset.step)));
}
album.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  turnPage(event.key === 'ArrowLeft' ? -1 : 1);
});
