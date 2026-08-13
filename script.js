import { business, services, faqs } from './config.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const icon = (name, className = '') => `<svg class="ui-icon ui-icon--${name}${className ? ` ${className}` : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;

// The 18 MB cinematic source is a desktop enhancement only. Small screens keep
// the locally generated poster, preserving the art direction without the decode cost.
const heroVideo = $('.hero-video');
if (matchMedia('(min-width: 761px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const source = $('source', heroVideo);
  source.src = source.dataset.src;
  heroVideo.load();
  heroVideo.play().catch(() => {});
}

// Content is first rendered as normal document content; interactions only enhance it.
const serviceStage = $('[data-services]');
let activeService = 0;
serviceStage.innerHTML = services.map((service, index) => `
  <article class="service-card ${index === 0 ? 'is-active' : 'is-future'}" data-service-index="${index}" aria-roledescription="Folie" aria-label="${index + 1} von ${services.length}: ${service.title}">
    <span class="service-number">${service.number}</span>
    <h3>${service.title}${icon('arrow-down-right', 'service-card__arrow')}</h3>
    <div class="service-detail"><p>${service.lead}</p><small>${service.text}</small></div>
    <button type="button" aria-label="${service.title} anzeigen"></button>
  </article>`).join('');
const cards = $$('.service-card', serviceStage);
const currentService = $('[data-service-current]');
function showService(next) {
  activeService = (next + services.length) % services.length;
  cards.forEach((card, index) => {
    card.classList.toggle('is-active', index === activeService);
    card.classList.toggle('is-past', index < activeService);
    card.classList.toggle('is-future', index > activeService);
    card.setAttribute('aria-hidden', String(index !== activeService));
  });
  currentService.textContent = services[activeService].number;
}
$('[data-service-prev]').addEventListener('click', () => showService(activeService - 1));
$('[data-service-next]').addEventListener('click', () => showService(activeService + 1));
cards.forEach((card, index) => $('button', card).addEventListener('click', () => showService(index)));
serviceStage.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); showService(activeService + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showService(activeService - 1); }
});
let swipeStart = 0;
serviceStage.addEventListener('touchstart', e => { swipeStart = e.changedTouches[0].screenX; }, { passive: true });
serviceStage.addEventListener('touchend', e => { const delta = e.changedTouches[0].screenX - swipeStart; if (Math.abs(delta) > 45) showService(activeService + (delta < 0 ? 1 : -1)); }, { passive: true });

const faqRoot = $('[data-faq]');
faqRoot.innerHTML = faqs.map(([question, answer], index) => `<article class="faq-item"><button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}"><small>0${index + 1}</small><span>${question}</span><b aria-hidden="true">+</b></button><div class="faq-answer" id="faq-answer-${index}"><div><p>${answer}</p></div></div></article>`).join('');
$$('.faq-question', faqRoot).forEach(button => button.addEventListener('click', () => {
  const item = button.closest('.faq-item'); const isOpen = item.classList.contains('is-open');
  $$('.faq-item', faqRoot).forEach(other => { other.classList.remove('is-open'); $('.faq-question', other).setAttribute('aria-expanded', 'false'); });
  if (!isOpen) { item.classList.add('is-open'); button.setAttribute('aria-expanded', 'true'); }
}));

// Editable business details from config.js.
$$('[data-email]').forEach(link => { link.textContent = business.email; link.href = `mailto:${business.email}`; });
$('[data-year]').textContent = new Date().getFullYear();

const header = $('[data-header]');
let ticking = false;
function updateHeader() { header.classList.toggle('scrolled', window.scrollY > 45); ticking = false; }
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; } }, { passive: true });
updateHeader();

const menuButton = $('.menu-button'); const mobileMenu = $('#mobile-menu');
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!open)); mobileMenu.hidden = open; });
$$('a', mobileMenu).forEach(link => link.addEventListener('click', () => { menuButton.setAttribute('aria-expanded', 'false'); mobileMenu.hidden = true; }));

const orderBoard = $('[data-order-board]');
const orderWords = $$('.order-word', orderBoard);
const boardContactTrigger = $('.contact-trigger');
const boardPointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
const boardReducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const boardConfig = { radius: 165, maxDisplacement: 36, edgePadding: 22, labelGap: 12, follow: .18 };
const boardState = { active: false, frame: 0, rect: null, labels: [], protectedZones: [], microZones: [], resizeObserver: null, presenceObserver: null, scrollTicking: false };
let boardRevealTimer;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const rectFromPoint = (x, y, width, height) => ({ left: x, top: y, right: x + width, bottom: y + height });

function boardCanRepel() { return boardPointerQuery.matches && !boardReducedMotionQuery.matches; }
function setBoardPosition(label, x = 0, y = 0) { label.repel.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`; }
function updateBoardViewportRect() {
  boardState.rect = orderBoard.getBoundingClientRect();
  const trigger = boardContactTrigger?.getBoundingClientRect(); const boardRect = boardState.rect; const triggerPadding = 14;
  const contactZone = trigger && overlaps(boardRect, trigger) ? [{ left: trigger.left - boardRect.left - triggerPadding, top: trigger.top - boardRect.top - triggerPadding, right: trigger.right - boardRect.left + triggerPadding, bottom: trigger.bottom - boardRect.top + triggerPadding }] : [];
  boardState.protectedZones = [...boardState.microZones, ...contactZone];
  boardState.scrollTicking = false;
}

function measureBoard() {
  orderWords.forEach(word => { $('.order-word__repel', word).style.transform = 'translate3d(0px, 0px, 0)'; });
  updateBoardViewportRect();
  const boardRect = boardState.rect;
  boardState.labels = orderWords.map(word => {
    const rect = word.getBoundingClientRect();
    return {
      word,
      repel: $('.order-word__repel', word),
      anchor: { x: rect.left - boardRect.left, y: rect.top - boardRect.top, width: rect.width, height: rect.height },
      current: { x: 0, y: 0 },
      target: { x: 0, y: 0 }
    };
  });
  boardState.microZones = $$('.board-note, .board-caption', orderBoard).map(element => {
    const rect = element.getBoundingClientRect(); const inset = 12;
    return { left: rect.left - boardRect.left - inset, top: rect.top - boardRect.top - inset, right: rect.right - boardRect.left + inset, bottom: rect.bottom - boardRect.top + inset };
  });
  updateBoardViewportRect();
}

function keepInsideBoard(label, x, y) {
  const { width, height } = label.anchor; const { width: boardWidth, height: boardHeight } = boardState.rect;
  return {
    x: clamp(x, boardConfig.edgePadding, boardWidth - boardConfig.edgePadding - width),
    y: clamp(y, boardConfig.edgePadding, boardHeight - boardConfig.edgePadding - height)
  };
}

function resolveBoardCollision(label, preferred, blockers) {
  let point = keepInsideBoard(label, preferred.x, preferred.y);
  const candidatesFor = blocker => [
    { x: blocker.left - boardConfig.labelGap - label.anchor.width, y: point.y },
    { x: blocker.right + boardConfig.labelGap, y: point.y },
    { x: point.x, y: blocker.top - boardConfig.labelGap - label.anchor.height },
    { x: point.x, y: blocker.bottom + boardConfig.labelGap }
  ];
  for (let pass = 0; pass < 2; pass += 1) {
    blockers.forEach(blocker => {
      const candidateRect = rectFromPoint(point.x, point.y, label.anchor.width, label.anchor.height);
      if (!overlaps(candidateRect, blocker)) return;
      point = candidatesFor(blocker)
        .map(candidate => keepInsideBoard(label, candidate.x, candidate.y))
        .map(candidate => ({ ...candidate, distance: (candidate.x - preferred.x) ** 2 + (candidate.y - preferred.y) ** 2 }))
        .sort((a, b) => a.distance - b.distance)[0];
    });
  }
  return point;
}

function updateBoardTargets(pointer) {
  if (!boardState.rect) return;
  const planned = boardState.labels.map(label => {
    const centerX = label.anchor.x + label.anchor.width / 2;
    const centerY = label.anchor.y + label.anchor.height / 2;
    let dx = centerX - pointer.x; let dy = centerY - pointer.y;
    const distance = Math.hypot(dx, dy);
    const strength = distance < boardConfig.radius ? (1 - distance / boardConfig.radius) ** 2 : 0;
    if (distance < .5) { dx = centerX - boardState.rect.width / 2; dy = centerY - boardState.rect.height / 2; }
    const length = Math.hypot(dx, dy) || 1;
    return { label, strength, preferred: { x: label.anchor.x + dx / length * boardConfig.maxDisplacement * strength, y: label.anchor.y + dy / length * boardConfig.maxDisplacement * strength } };
  }).sort((a, b) => b.strength - a.strength);
  const placed = [];
  planned.forEach(item => {
    const point = resolveBoardCollision(item.label, item.preferred, [...boardState.protectedZones, ...placed]);
    item.label.target.x = point.x - item.label.anchor.x;
    item.label.target.y = point.y - item.label.anchor.y;
    placed.push(rectFromPoint(point.x, point.y, item.label.anchor.width, item.label.anchor.height));
  });
}

function renderBoardRepulsion() {
  let moving = false;
  boardState.labels.forEach(label => {
    label.current.x += (label.target.x - label.current.x) * boardConfig.follow;
    label.current.y += (label.target.y - label.current.y) * boardConfig.follow;
    if (Math.abs(label.target.x - label.current.x) < .08) label.current.x = label.target.x;
    if (Math.abs(label.target.y - label.current.y) < .08) label.current.y = label.target.y;
    setBoardPosition(label, label.current.x, label.current.y);
    moving ||= label.current.x !== label.target.x || label.current.y !== label.target.y;
  });
  boardState.frame = moving ? requestAnimationFrame(renderBoardRepulsion) : 0;
}

function wakeBoardRepulsion() { if (!boardState.frame) boardState.frame = requestAnimationFrame(renderBoardRepulsion); }
function returnBoardWords(immediate = false) {
  boardState.labels.forEach(label => { label.target.x = 0; label.target.y = 0; if (immediate) { label.current.x = 0; label.current.y = 0; setBoardPosition(label); } });
  if (immediate && boardState.frame) { cancelAnimationFrame(boardState.frame); boardState.frame = 0; }
  else wakeBoardRepulsion();
}

function onBoardPointerMove(event) {
  const rect = boardState.rect; if (!rect) return;
  updateBoardTargets({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  wakeBoardRepulsion();
}
function onBoardPointerLeave() { returnBoardWords(); }
function onBoardResize() { measureBoard(); returnBoardWords(true); }
function onBoardScroll() { if (!boardState.scrollTicking) { boardState.scrollTicking = true; requestAnimationFrame(updateBoardViewportRect); } }
function onBoardBlur() { returnBoardWords(); }

function activateBoardRepulsion() {
  if (boardState.active || !boardCanRepel()) return;
  measureBoard(); boardState.active = true; orderBoard.classList.add('is-interactive');
  orderBoard.addEventListener('pointermove', onBoardPointerMove, { passive: true });
  orderBoard.addEventListener('pointerleave', onBoardPointerLeave, { passive: true });
  window.addEventListener('resize', onBoardResize, { passive: true });
  window.addEventListener('scroll', onBoardScroll, { passive: true });
  window.addEventListener('blur', onBoardBlur);
  boardState.resizeObserver = new ResizeObserver(onBoardResize); boardState.resizeObserver.observe(orderBoard);
  boardState.presenceObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) returnBoardWords(true); }), { threshold: 0 });
  boardState.presenceObserver.observe(orderBoard);
}

function deactivateBoardRepulsion() {
  if (!boardState.active) return;
  returnBoardWords(true); boardState.active = false; orderBoard.classList.remove('is-interactive');
  orderBoard.removeEventListener('pointermove', onBoardPointerMove); orderBoard.removeEventListener('pointerleave', onBoardPointerLeave);
  window.removeEventListener('resize', onBoardResize); window.removeEventListener('scroll', onBoardScroll); window.removeEventListener('blur', onBoardBlur);
  boardState.resizeObserver?.disconnect(); boardState.presenceObserver?.disconnect(); boardState.resizeObserver = null; boardState.presenceObserver = null;
}

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('is-seen'); observer.unobserve(entry.target);
  if (boardCanRepel()) boardRevealTimer = window.setTimeout(activateBoardRepulsion, 840);
}), { threshold: .38 });
observer.observe(orderBoard);
boardPointerQuery.addEventListener('change', () => { if (boardCanRepel()) activateBoardRepulsion(); else deactivateBoardRepulsion(); });
boardReducedMotionQuery.addEventListener('change', () => { if (boardCanRepel()) activateBoardRepulsion(); else deactivateBoardRepulsion(); });
window.addEventListener('pagehide', () => { clearTimeout(boardRevealTimer); deactivateBoardRepulsion(); });

// The intro panel is visible without JavaScript. On larger screens it receives a
// single bottom-anchored mask reveal after the section has meaningfully entered view.
const introPanel = $('[data-intro-panel]');
const introPanelReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const introPanelDelay = 1000;
let introPanelRevealTimer;
const revealIntroPanel = () => requestAnimationFrame(() => introPanel.classList.add('is-unfurled'));
if (introPanelReducedMotion.matches || !matchMedia('(min-width: 761px)').matches) {
  introPanel.classList.add('is-unfurled');
} else {
  introPanel.classList.add('is-unfurl-ready');
  const introPanelObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting || introPanelRevealTimer || introPanel.classList.contains('is-unfurled')) return;
    introPanelRevealTimer = window.setTimeout(() => {
      const rect = introPanel.getBoundingClientRect();
      const isStillVisible = rect.top < innerHeight * .92 && rect.bottom > innerHeight * .08;
      introPanelRevealTimer = undefined;
      if (isStillVisible) { revealIntroPanel(); introPanelObserver.unobserve(entry.target); }
    }, introPanelDelay);
  }), { threshold: .35, rootMargin: '0px 0px -8% 0px' });
  introPanelObserver.observe(introPanel);
  window.addEventListener('pagehide', () => clearTimeout(introPanelRevealTimer), { once: true });
}

// Gentle, paused-on-hidden editorial word variation. No terminal-typewriter behaviour.
const heroWord = $('[data-hero-word]'); const heroWords = ['Aber nicht', 'Alles außer', 'Und nie']; let wordIndex = 0; let wordTimer;
function cycleHeroWord() { if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return; heroWord.animate([{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-11px)', filter: 'blur(3px)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished.then(() => { wordIndex = (wordIndex + 1) % heroWords.length; heroWord.textContent = heroWords[wordIndex]; heroWord.animate([{ opacity: 0, transform: 'translateY(11px)', filter: 'blur(3px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 490, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }); }); }
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { wordTimer = window.setInterval(cycleHeroWord, 4100); document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInterval(wordTimer); } else { wordTimer = window.setInterval(cycleHeroWord, 4100); } }); }

const layer = $('[data-contact-layer]'); const panel = $('.contact-panel'); const trigger = $('.contact-trigger'); let lastFocus;
const privacyLayer = $('[data-privacy-layer]'); const privacyPanel = $('.legal-panel'); let lastPrivacyFocus;
const panelFocusables = target => $$('button, [href], input, select, textarea', target).filter(element => !element.disabled);
function trapFocus(event, target) {
  const list = panelFocusables(target); if (!list.length) return;
  const first = list[0]; const last = list[list.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
function openContact() { lastFocus = document.activeElement; layer.classList.add('is-open'); layer.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); window.setTimeout(() => $('.close-contact', panel).focus(), 180); }
function closeContact() { layer.classList.remove('is-open'); layer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); window.setTimeout(() => (lastFocus || trigger).focus(), 650); }
function openPrivacy() { const active = document.activeElement; lastPrivacyFocus = active instanceof HTMLElement && active !== document.body ? active : $('[data-open-privacy]'); privacyLayer.classList.add('is-open'); privacyLayer.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); window.setTimeout(() => $('.close-legal', privacyPanel).focus(), 160); }
function closePrivacy() { privacyLayer.classList.remove('is-open'); privacyLayer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); window.setTimeout(() => (lastPrivacyFocus || $('[data-open-privacy]')).focus(), 420); }
$$('[data-open-contact]').forEach(button => button.addEventListener('click', openContact));
$$('[data-close-contact]').forEach(button => button.addEventListener('click', closeContact));
$$('[data-open-privacy]').forEach(button => button.addEventListener('click', openPrivacy));
$$('[data-close-privacy]').forEach(button => button.addEventListener('click', closePrivacy));
document.addEventListener('keydown', event => {
  if (privacyLayer.classList.contains('is-open')) { if (event.key === 'Escape') { event.preventDefault(); closePrivacy(); } if (event.key === 'Tab') trapFocus(event, privacyPanel); return; }
  if (!layer.classList.contains('is-open')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeContact(); }
  if (event.key === 'Tab') trapFocus(event, panel);
});

const form = $('[data-contact-form]'); const message = $('[data-form-message]');
const submitMarkup = `Anfrage senden ${icon('arrow-up-right')}`;
function contactPayload() {
  return {
    name: form.elements.name.value,
    email: form.elements.email.value,
    service: form.elements.service.value,
    message: form.elements.message.value,
    consent: form.elements.consent.checked,
    website: form.elements.website.value
  };
}
form.addEventListener('submit', async event => {
  event.preventDefault(); message.className = 'form-message';
  if (!form.checkValidity()) { form.reportValidity(); message.textContent = 'Bitte prüfe die markierten Pflichtfelder.'; message.classList.add('error'); return; }
  const submit = $('.form-submit', form);
  if (submit.disabled) return;
  submit.disabled = true; submit.setAttribute('aria-busy', 'true'); submit.innerHTML = `Wird gesendet ${icon('arrow-up-right')}`;
  message.textContent = 'Deine Anfrage wird gesendet …'; message.classList.add('notice');
  try {
    const response = await fetch(business.formEndpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(contactPayload())
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) throw new Error(result?.message || 'Das hat gerade nicht geklappt. Schreib uns alternativ direkt an info@sauberei.eu.');
    form.reset(); message.textContent = result.message || 'Danke! Deine Anfrage ist bei uns angekommen. Wir melden uns so schnell wie möglich.'; message.className = 'form-message success';
  } catch (error) {
    message.textContent = error instanceof Error && error.message ? error.message : 'Das hat gerade nicht geklappt. Schreib uns alternativ direkt an info@sauberei.eu.';
    message.className = 'form-message error';
  } finally {
    submit.disabled = false; submit.removeAttribute('aria-busy'); submit.innerHTML = submitMarkup;
  }
});
$('[data-back-top]').addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));

// A small magnetic response, only when a precise pointer exists. It never moves focusable controls far from their hit area.
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  $$('.magnetic').forEach(el => { el.addEventListener('pointermove', event => { const rect = el.getBoundingClientRect(); const x = (event.clientX - rect.left - rect.width / 2) * .10; const y = (event.clientY - rect.top - rect.height / 2) * .10; el.style.transform = `translate3d(${x}px, ${y}px, 0)`; }); el.addEventListener('pointerleave', () => { el.style.transform = ''; }); });
}
