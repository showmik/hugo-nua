/* assets/js/upvote.js — browser-only */
(() => {
  'use strict';

  // Try /api/upvote first; if it fails (404/500/network), fall back to /.netlify/functions/upvote
  const endpoints = ['/api/upvote', '/.netlify/functions/upvote'];
  let resolved = null;

  async function call(method, payload) {
    const slug = payload?.slug;
    let lastErr = null;

    for (const base of resolved ? [resolved] : endpoints) {
      try {
        const url = method === 'GET'
          ? `${base}?slug=${encodeURIComponent(slug)}`
          : base;

        const opt = method === 'GET'
          ? { method: 'GET' }
          : {
              method: 'POST',
              headers: { 'content-type': 'application/x-www-form-urlencoded' },
              body: `slug=${encodeURIComponent(slug)}`
            };

        const r = await fetch(url, opt);
        if (!r.ok) {
          lastErr = new Error(`HTTP ${r.status}`);
          continue;
        }
        const data = await r.json();
        resolved = base; // remember the working endpoint
        return data;
      } catch (e) {
        lastErr = e;
        // try next candidate
      }
    }
    // If both endpoints failed, surface a consistent “not available” result
    console.warn('[upvote] API unreachable:', lastErr?.message || lastErr);
    return { count: 0, voted: false };
  }

  const widgets = document.querySelectorAll('.vote[data-slug]');
  if (!widgets.length) return;

  const setUI = (root, data) => {
    const btn = root.querySelector('.vote-btn');
    const out = root.querySelector('[data-count]');
    const count = Number.isFinite(data?.count) ? data.count : 0;
    out.textContent = String(count);
    const voted = !!data?.voted;
    btn.disabled = voted;
    btn.setAttribute('aria-pressed', voted ? 'true' : 'false');
    if (data?.nextAllowedAt) {
      try {
        const t = new Date(data.nextAllowedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        btn.title = `Thanks! Next vote after ${t}`;
      } catch {}
    }
  };

  for (const root of widgets) {
    const slug = root.getAttribute('data-slug');
    const btn  = root.querySelector('.vote-btn');
    const out  = root.querySelector('[data-count]');
    if (!slug || !btn || !out) continue;

    // 1) fetch canonical state
    call('GET', { slug }).then(data => setUI(root, data));

    // 2) optimistic +1 then confirm with server
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;

      const n0 = parseInt(out.textContent || '0', 10) || 0;
      out.textContent = String(n0 + 1);
      btn.disabled = true;
      btn.setAttribute('aria-pressed', 'true');

      try {
        const data = await call('POST', { slug });
        setUI(root, data);
      } catch {
        // rollback on unexpected failure (rare with call())
        out.textContent = String(n0);
        btn.disabled = false;
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }
})();
