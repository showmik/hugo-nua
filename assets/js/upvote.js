(() => {
  const forms = document.querySelectorAll('form.upvote-form');
  if (!forms.length) return;

  // Reconcile live counts on load
  for (const f of forms) {
    const action = f.getAttribute('action');
    const [base, rest] = action.split('/upvote/');
    const slug = decodeURIComponent(rest || '').replace(/\/+$/,'');
    fetch(`${base}/count?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(({count}) => { const el = f.querySelector('.upvote-count'); if (el) el.textContent = count ?? 0; })
      .catch(() => {});
  }

  // Optimistic +1 on submit
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form.upvote-form'); if (!form) return;
    e.preventDefault();
    const btn = form.querySelector('button');
    const el  = form.querySelector('.upvote-count');
    const n   = parseInt((el?.textContent || "0"), 10) || 0;

    if (el) el.textContent = String(n + 1);
    if (btn) { btn.disabled = true; btn.style.color = "salmon"; btn.setAttribute('aria-pressed','true'); }

    fetch(form.action, { method: 'POST', body: new FormData(form) })
      .then(r => r.json())
      .then(d => { if (typeof d.count === "number" && el) el.textContent = String(d.count); })
      .catch(() => {}); // keep optimistic UI if offline
  });
})();
