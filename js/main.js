(() => {
  'use strict';
  const chat = window.AvaChat.init();
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  }
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeNav(); toggle.focus(); }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', closeNav);

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      closeNav();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => { closeNav(); chat.open('book'); }));
  document.querySelectorAll('[data-chat]').forEach(button => button.addEventListener('click', () => chat.open()));
  document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => chat.open('service', button.dataset.service)));

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => { element.classList.add('is-pending'); observer.observe(element); });
  }
  document.getElementById('year').textContent = new Date().getFullYear();
})();
