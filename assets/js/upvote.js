/* assets/js/upvote.js */
(() => {
  'use strict';
  const endpoint = '/api/upvote'; // serverless function path

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

  const loadState = async (slug) => {
    try {
      const r = await fetch(`${endpoint}?slug=${encodeURIComponent(slug)}`);
      if (!r.ok) throw 0;
      return await r.json(); // {count, voted, nextAllowedAt}
    } catch {
      return { count: 0, voted: false };
    }
  };

  for (const root of widgets) {
    const slug = root.getAttribute('data-slug');
    const btn  = root.querySelector('.vote-btn');
    const out  = root.querySelector('[data-count]');
    if (!slug || !btn || !out) continue;

    // 1) initial canonical state
    loadState(slug).then(data => setUI(root, data));

    // 2) optimistic +1 then confirm with server
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;

      const n0 = parseInt(out.textContent || '0', 10) || 0;
      out.textContent = String(n0 + 1);
      btn.disabled = true;
      btn.setAttribute('aria-pressed', 'true');

      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: `slug=${encodeURIComponent(slug)}`
        });
        const data = await r.json();
        setUI(root, data);
      } catch {
        // rollback on failure
        out.textContent = String(n0);
        btn.disabled = false;
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }
})();
