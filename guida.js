const main = document.querySelector('main');
const search = document.querySelector('#ricerca');
const nav = document.querySelector('#capitoli');
const sidebar = document.querySelector('#indice');
const openIndex = document.querySelector('#apri-indice');
const scrim = document.querySelector('.scrim');
const theme = document.querySelector('#tema');
const zoom = document.querySelector('#zoom');
const mobile = matchMedia('(max-width: 820px)');
const byId = new Map(sections.map(section => [section.id, section]));
const remoteHotspots = [
  ['5', 'dock', 33.3, 6.4],
  ['6', 'cd', 64, 7.2],
  ['13', 'dock', 32.5, 61.5],
  ['16', 'collegamenti', 33.3, 92.5],
  ['23', 'radio', 78, 7.2],
  ['29', 'sportello', 69, 91.1],
];
const topHotspots = [
  ['2', 'collegamenti', 16.2, 13],
  ['17', 'sportello', 24.6, 13],
  ['5', 'dock', 33.9, 13],
  ['6', 'cd', 38.6, 13],
  ['23', 'radio', 43.3, 13],
  ['24', 'cd', 51.7, 13],
  ['8', 'cd', 57, 13],
  ['29', 'sportello', 85, 13],
];
let current = sections[0];

function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

function link(id, ...children) {
  return el('a', { href: '#' + id }, ...children);
}

function pdf(page, label) {
  return el('a', { href: 'manuale.pdf#page=' + page, target: '_blank', rel: 'noopener' }, label);
}

function normalize(value) {
  return value.toLocaleLowerCase('it').normalize('NFD').replace(/\p{Mark}/gu, '');
}

const searchText = new Map(sections.map(section => [
  section.id,
  normalize([section.group, section.title, section.heading, section.lead, ...section.blocks.flat(Infinity)].join(' ')),
]));

function renderIndex() {
  const words = normalize(search.value.trim()).split(/\s+/);
  const visible = sections.filter(section => words.every(word => searchText.get(section.id).includes(word)));
  nav.replaceChildren();
  let group;
  for (const section of visible) {
    if (section.group !== group) {
      group = section.group;
      nav.append(el('p', { class: 'group' }, group));
    }
    const number = String(sections.indexOf(section) + 1).padStart(2, '0');
    const item = link(section.id, el('span', { class: 'num', 'aria-hidden': 'true' }, number), section.title);
    if (section === current) item.setAttribute('aria-current', 'page');
    nav.append(item);
  }
  if (!visible.length) nav.append(el('p', {}, 'Nessun capitolo trovato.'));
  document.querySelector('#esiti').textContent = visible.length + ' capitoli trovati';
}

function figure([file, caption, page]) {
  const image = el('img', { src: 'immagini/' + file + '.png', alt: caption });
  const artwork = el('div', { class: file === 'comandi-alto' ? 'artwork top-controls' : 'artwork' }, image);
  const hotspots = file === 'comandi-alto' ? topHotspots : file === 'telecomando' ? remoteHotspots : [];
  if (hotspots.length) {
    for (const [number, id, x, y] of hotspots) {
      const pin = link(id);
      pin.className = 'hotspot';
      pin.style.left = x + '%';
      pin.style.top = y + '%';
      pin.setAttribute('aria-label', number + ' · ' + byId.get(id).title);
      pin.title = byId.get(id).title;
      artwork.append(pin);
    }
  }
  const button = el('button', { class: 'zoom', type: 'button', 'aria-label': 'Ingrandisci ' + caption }, 'Ingrandisci');
  button.addEventListener('click', () => {
    const enlarged = document.querySelector('#immagine-zoom');
    enlarged.src = image.src;
    enlarged.alt = caption;
    document.querySelector('#didascalia-zoom').textContent = caption;
    zoom.showModal();
  });
  return el('figure', {}, el('div', { class: 'figbox' }, artwork, el('div', {}, button)),
    el('figcaption', {}, caption + ' · ', pdf(page, 'Manuale, p. ' + page)));
}

function block([kind, title, content, rows]) {
  const heading = el('h2', {}, title);
  switch (kind) {
    case 'links':
      return el('div', { class: 'cards' }, ...title.map(id => {
        const card = link(id, byId.get(id).title, el('span', { 'aria-hidden': 'true' }, '→'));
        card.className = 'card';
        return card;
      }));
    case 'note':
      return el('aside', { class: 'note' }, el('strong', {}, title), el('p', {}, content));
    case 'text':
      return el('section', {}, heading, el('p', {}, content));
    case 'steps':
      return el('section', {}, heading, el('ol', { class: 'steps' },
        ...content.map(([name, description]) => el('li', {}, el('strong', {}, name), description))));
    case 'faq':
      return el('section', {}, heading, ...content.map(([question, answer]) =>
        el('details', {}, el('summary', {}, question), el('p', {}, answer))));
    case 'table': {
      const head = el('thead', {}, el('tr', {}, ...content.map(value => el('th', { scope: 'col' }, value))));
      const body = el('tbody', {}, ...rows.map(row => el('tr', {}, ...row.map(value => el('td', {}, value)))));
      return el('section', {}, heading, el('div', { class: 'tablewrap' }, el('table', {}, head, body)));
    }
  }
}

function setIndex(open, restoreFocus = true) {
  sidebar.classList.toggle('open', open);
  document.querySelector('.main').inert = open;
  openIndex.setAttribute('aria-expanded', String(open));
  scrim.hidden = !open;
  if (open) search.focus();
  else if (restoreFocus) openIndex.focus();
}

function render(navigating = false) {
  current = byId.get(location.hash.slice(1)) || sections[0];
  const index = sections.indexOf(current);
  document.title = (current.heading || current.title) + ' · Guida Panasonic';
  document.querySelector('#avanzamento').style.width = ((index + 1) / sections.length * 100) + '%';
  renderIndex();

  const header = el('header', {},
    el('div', { class: 'kicker' }, current.group + ' · ' + (index + 1) + ' / ' + sections.length),
    el('h1', {}, current.heading || current.title));
  header.append(el('p', { class: 'lead' }, current.lead));
  const sources = el('div', { class: 'sources' }, 'Nel manuale originale',
    ...current.pages.map(page => pdf(page, 'p. ' + page)));
  const adjacent = [sections[index - 1], sections[index + 1]];
  const pager = el('nav', { class: 'pager', 'aria-label': 'Capitoli adiacenti' },
    ...adjacent.map((section, position) => section ?
      link(section.id, el('small', {}, position ? 'Successivo →' : '← Precedente'), section.title) : el('span')));
  main.replaceChildren(header, ...(current.figures || []).map(figure),
    ...current.blocks.map(block), sources, pager, el('p', { class: 'hint' }, 'Usa ← e → per cambiare capitolo.'));
  if (navigating) {
    setIndex(false, false);
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

function updateTheme(dark) {
  const value = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = value;
  theme.setAttribute('aria-pressed', String(dark));
  return value;
}

updateTheme(document.documentElement.dataset.theme === 'dark');
theme.addEventListener('click', () => {
  const value = updateTheme(theme.getAttribute('aria-pressed') !== 'true');
  try { localStorage.setItem('panasonic-theme', value); } catch {}
});

search.addEventListener('input', renderIndex);
openIndex.addEventListener('click', () => setIndex(true));
scrim.addEventListener('click', () => setIndex(false));
document.querySelector('#chiudi-indice').addEventListener('click', () => setIndex(false));
mobile.addEventListener('change', () => setIndex(false, false));
zoom.addEventListener('click', event => {
  if (event.target === zoom) {
    const box = zoom.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) zoom.close();
  }
});
document.addEventListener('click', event => {
  const anchor = event.target.closest('a');
  if (anchor?.hasAttribute('data-skip')) {
    event.preventDefault();
    main.focus();
  }
  if (anchor?.getAttribute('href') === location.hash && sidebar.classList.contains('open')) {
    event.preventDefault();
    setIndex(false, false);
    main.focus();
  }
});
window.addEventListener('hashchange', () => render(true));
document.addEventListener('keydown', event => {
  if (zoom.open) return;
  if (sidebar.classList.contains('open')) {
    if (event.key === 'Escape') setIndex(false);
    return;
  }
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      event.target.closest('input, textarea, select, [contenteditable], button, summary')) return;
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const next = sections[sections.indexOf(current) + (event.key === 'ArrowRight' ? 1 : -1)];
  if (next) {
    event.preventDefault();
    location.hash = next.id;
  }
});
render();

