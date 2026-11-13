/* One cancellable sequence; only opacity/transform animate (no layout work). */
window.createDesktopAuth = function (modal) {
  const root = document.documentElement;
  const desktop = matchMedia('(min-width: 1025px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let user = null, generation = 0, running = false;
  const screen = document.createElement('div');
  screen.className = 'desktop-welcome';
  screen.hidden = true;
  screen.setAttribute('role', 'status');
  screen.setAttribute('aria-live', 'polite');
  screen.innerHTML = '<div class="desktop-welcome-content"><p class="desktop-welcome-brand">PATRIMOINE</p><h1 class="desktop-welcome-title"></h1><div class="desktop-welcome-line" aria-hidden="true"></div><p class="desktop-welcome-caption">Votre espace personnel</p></div>';
  document.body.appendChild(screen);
  const app = document.querySelector('.app');
  function sync() {
    const locked = desktop.matches && !user;
    root.classList.toggle('desktop-auth-locked', locked);
    // Keep the form available to keyboard users, but not the dashboard behind it.
    Array.from(app.children).forEach(el => {
      if (el !== modal && el.tagName !== 'SCRIPT') el.inert = locked;
    });
    if (locked) modal.classList.add('show');
  }
  desktop.addEventListener('change', sync);
  function cancel() {
    generation++;
    screen.getAnimations({ subtree: true }).forEach(a => a.cancel());
    screen.hidden = true;
    app.inert = false;
    running = false;
    root.classList.remove('desktop-auth-transition');
  }
  async function animate(el, frames, duration) {
    const animation = el.animate(frames, { duration: reduced.matches ? 100 : duration, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
    try { await animation.finished; } catch (_) { /* Cancelled by sign-out. */ }
    animation.cancel();
  }
  return {
    cancel,
    get blocked() { return (desktop.matches && !user) || running; },
    get running() { return running; },
    setSession(next) {
      user = next;
      if (!user) cancel();
      root.classList.remove('auth-pending');
      sync();
    },
    async welcome(next, ready, first) {
      if (!desktop.matches || next.is_anonymous) { await ready; return false; }
      if (running) return true;
      running = true;
      root.classList.add('desktop-auth-transition');
      const token = ++generation;
      const active = () => token === generation;
      app.inert = true;
      const title = screen.querySelector('h1');
      title.textContent = first ? 'Bienvenue' : 'Bon retour';
      // Leave the success message readable before covering the form.
      await new Promise(resolve => setTimeout(resolve, reduced.matches ? 250 : 650));
      if (!active()) return true;
      const content = screen.firstElementChild;
      content.style.opacity = '0';
      screen.hidden = false;
      await animate(screen, [{ opacity: 0 }, { opacity: 1 }], 600);
      if (!active()) return true;
      content.style.opacity = '1';
      await Promise.all([
        animate(content, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }], 900),
        ready
      ]);
      if (!active()) return true;
      await new Promise(resolve => setTimeout(resolve, reduced.matches ? 300 : 850));
      if (!active()) return true;
      showPage('overview');
      root.classList.remove('desktop-auth-transition');
      modal.classList.remove('show');
      document.body.style.overflow = '';
      await animate(screen, [{ opacity: 1 }, { opacity: 0 }], 700);
      if (!active()) return true;
      screen.hidden = true;
      app.inert = false;
      running = false;
      const overview = document.getElementById('page-overview');
      overview.tabIndex = -1;
      overview.focus({ preventScroll: true });
      if (window.checkEvolutionMonthlyReminder) window.checkEvolutionMonthlyReminder();
      return true;
    }
  };
};
