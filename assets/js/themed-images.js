/* assets/js/themed-images.js
   Theme-aware images with preload + cross-fade + deduped updates.
   Expects: <img data-light-src="..." data-dark-src="..." src="(light or dark)">
*/
;(() => {
  const root = document.documentElement;
  const getTheme = () =>
    root.getAttribute('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const Q = 'img[data-light-src],img[data-dark-src]';
  let lastTheme = null; // remember last applied doc theme

  // Ensure a wrapper so we can overlay a fading clone
  const ensureWrap = (img) => {
    const p = img.parentElement;
    if (p && p.classList.contains('themed-img-wrap')) return p;
    const wrap = document.createElement('span');
    wrap.className = 'themed-img-wrap';
    wrap.style.position = 'relative';
    wrap.style.display = 'inline-block';
    img.parentElement?.insertBefore(wrap, img);
    wrap.appendChild(img);
    return wrap;
  };

  const sameUrl = (a, b) => {
    try {
      const A = new URL(a, document.baseURI);
      const B = new URL(b, document.baseURI);
      return A.href === B.href;
    } catch {
      return a === b;
    }
  };

  const preload = (src, srcset) =>
    new Promise((resolve) => {
      if (!src && !srcset) return resolve(null);
      const pic = new Image();
      if (srcset) pic.srcset = srcset;
      if (src) pic.src = src;
      pic.decoding = 'async';
      pic.onload = pic.onerror = () => resolve(pic);
    });

  const desiredFor = (img, t) => ({
    src:    t === 'dark' ? img.dataset.darkSrc    : img.dataset.lightSrc,
    srcset: t === 'dark' ? img.dataset.darkSrcset : img.dataset.lightSrcset,
  });

  const effectiveUrl = (img) => img.currentSrc || img.src;

  const fadeSwap = async (img, t) => {
    // Per-image guard: if already applied, do nothing
    if (img.dataset._appliedTheme === t) return;

    const want = desiredFor(img, t);
    if (!want.src && !want.srcset) return;

    const have = effectiveUrl(img);
    if (want.src && sameUrl(have, want.src)) {
      img.dataset._appliedTheme = t;
      return; // already correct
    }

    // Preload target to avoid a blank flash
    await preload(want.src, want.srcset);

    const wrap = ensureWrap(img);
    // Clean any previous overlay
    wrap.querySelector('.themed-img-fader')?.remove();

    // Overlay clone that will fade in
    const overlay = img.cloneNode(false);
    overlay.removeAttribute('id');
    overlay.classList.add('themed-img-fader');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 180ms ease';
    overlay.style.pointerEvents = 'none';

    if (want.srcset) overlay.srcset = want.srcset; else overlay.removeAttribute('srcset');
    if (want.src) overlay.src = want.src;

    wrap.appendChild(overlay);
    // Force reflow then fade in
    overlay.getBoundingClientRect();
    overlay.style.opacity = '1';

    overlay.addEventListener(
      'transitionend',
      () => {
        if (want.srcset) img.srcset = want.srcset;
        else img.removeAttribute('srcset');
        if (want.src) img.src = want.src;
        overlay.remove();
        img.dataset._appliedTheme = t; // mark as done
      },
      { once: true }
    );
  };

  const updateAll = (t = getTheme(), force = false) => {
    // Only react when theme actually changes (unless forced at init)
    if (!force && lastTheme === t) return;
    lastTheme = t;
    document.querySelectorAll(Q).forEach((img) => fadeSwap(img, t));
  };

  const init = () => {
    document.querySelectorAll(Q).forEach((img) => {
      ensureWrap(img);
      // (Optional) Warm the opposite theme once so the first toggle is smooth
      const other = getTheme() === 'dark'
        ? { src: img.dataset.lightSrc, srcset: img.dataset.lightSrcset }
        : { src: img.dataset.darkSrc,  srcset: img.dataset.darkSrcset  };
      (window.requestIdleCallback
        ? () => requestIdleCallback(() => preload(other.src, other.srcset))
        : () => setTimeout(() => preload(other.src, other.srcset), 500))();
    });
    updateAll(getTheme(), /*force*/ true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }

  // React to your toggle (<html theme="..."> changes)
  new MutationObserver(() => updateAll())
    .observe(root, { attributes: true, attributeFilter: ['theme'] });

  // If your toggle dispatches a custom event, listen to it too
  document.addEventListener('themechange', () => updateAll());

  // Also react to OS theme change and cross-tab storage updates
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', () => updateAll());
  mq.addListener?.(() => updateAll()); // Safari fallback
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme-preference') updateAll();
  });

  // Optional manual hook
  window.__updateThemedImages = updateAll;
})();
