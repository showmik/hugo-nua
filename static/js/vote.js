(() => {
  const el = document.querySelector('.vote[data-slug]');
  if (!el) return;

  const slug = new URL(el.dataset.slug, document.baseURI).pathname.replace(/\/+$/, '/') || '/';
  const btn  = el.querySelector('button[data-action="upvote"]');
  const out  = el.querySelector('[data-count]');
  const key  = `voted:${slug}`;
  const fx   = (n) => Intl.NumberFormat().format(n);

  const dev = { get(){ return parseInt(localStorage.getItem(`dev:count:${slug}`) || '0', 10); },
                set(n){ localStorage.setItem(`dev:count:${slug}`, String(n)); } };

  async function getCount() {
    try {
      const r = await fetch(`/.netlify/functions/vote?slug=${encodeURIComponent(slug)}`, { credentials: 'same-origin' });
      if (!r.ok) throw 0;
      const d = await r.json();
      out.textContent = fx(d.count || 0);
      if (d.alreadyVoted || localStorage.getItem(key) === '1') { btn.setAttribute('aria-pressed','true'); btn.disabled = true; }
    } catch { out.textContent = fx(dev.get()); }
  }

  async function upvote() {
    if (btn.disabled) return;
    btn.disabled = true; btn.setAttribute('aria-pressed','true');
    try {
      const r = await fetch('/.netlify/functions/vote', {
        method:'POST', credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ slug })
      });
      if (!r.ok) throw 0;
      const d = await r.json();
      out.textContent = fx(d.count || 0);
      localStorage.setItem(key,'1');
    } catch {
      const n = dev.get() + 1; dev.set(n); out.textContent = fx(n); localStorage.setItem(key,'1');
    }
  }

  btn.addEventListener('click', upvote, { passive:true });
  new IntersectionObserver((es, ob) => {
    if (es.some(e => e.isIntersecting)) { getCount(); ob.disconnect(); }
  }).observe(el);
})();
