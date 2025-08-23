/* search.js — robust, baseURL-aware, Fuse-optional search with safe DOM rendering */
(() => {
  'use strict';

  function init() {
    const searchInput = document.getElementById('search');
    const postListWrapper = document.getElementById('post-list-wrapper');

    // Abort if markup is not present (e.g., non-list pages)
    if (!searchInput || !postListWrapper) return;

    // Where to fetch the index from:
    // 1) <input id="search" data-index="/index.json">
    // 2) <meta name="search-index" content="/index.json">
    // 3) fallback to "index.json" relative to baseURI
    const indexUrl =
      searchInput.getAttribute('data-index') ||
      (document.querySelector('meta[name="search-index"]')?.getAttribute('content')) ||
      'index.json';
    const absoluteIndexUrl = new URL(indexUrl, document.baseURI).href;

    const state = {
      posts: [],
      fuse: null,
      loaded: false,
      loading: false,
      pendingQuery: ''
    };

    const searchKeys = ['title', 'tags', 'summary'];

    const onInput = debounce(() => {
      const q = (searchInput.value || '').trim();
      state.pendingQuery = q;

      if (!state.loaded) {
        ensureDataLoaded();
        renderLoading();
        return;
      }
      if (!q) {
        renderPosts(state.posts);
        return;
      }
      renderPosts(runSearch(q, state.posts));
    }, 120);

    searchInput.addEventListener('input', onInput);

    searchInput.addEventListener('focus', () => {
      if (!state.loaded && !state.loading) {
        ensureDataLoaded();
        renderLoading();
      }
    }, { once: true });

    // ---- Data loading ----
    async function ensureDataLoaded() {
      if (state.loaded || state.loading) return;
      state.loading = true;

      try {
        const res = await fetch(absoluteIndexUrl, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const normalized = Array.isArray(data) ? data.map(normalizePost) : [];

        // Sort newest → oldest
        normalized.sort((a, b) => b.dateMs - a.dateMs);

        state.posts = normalized;

        if (typeof Fuse !== 'undefined') {
          state.fuse = new Fuse(normalized, {
            includeScore: true,
            threshold: 0.3,
            ignoreLocation: true,
            keys: searchKeys
          });
        }

        state.loaded = true;
        state.loading = false;

        if (state.pendingQuery) {
          renderPosts(runSearch(state.pendingQuery, state.posts));
        } else {
          renderPosts(state.posts);
        }
      } catch (err) {
        console.error('Search index load failed:', err);
        state.loading = false;
        renderError('Could not load search index.');
      }
    }

    // ---- Helpers ----
    function normalizePost(p) {
      const dateStr = p.date || p.publishDate || p.published || p.lastmod || '';
      const date = dateStr ? new Date(dateStr) : null;
      const dateMs = date?.getTime() || 0;
      const year = date ? date.getFullYear() : (p.year ?? 'Unknown');
      const href = p.href || p.permalink || p.url || '#';
      return {
        title: String(p.title || '').trim(),
        summary: String(p.summary || p.description || '').trim(),
        tags: Array.isArray(p.tags)
          ? p.tags
          : p.tags
            ? String(p.tags).split(/[,\s]+/).filter(Boolean)
            : [],
        date,
        dateMs,
        year,
        href
      };
    }

    function runSearch(q, posts) {
      if (state.fuse) {
        return state.fuse.search(q).map((r) => r.item);
      }
      const qs = q.toLowerCase();
      return posts.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(qs)) ||
          (p.summary && p.summary.toLowerCase().includes(qs)) ||
          (p.tags && p.tags.some((t) => String(t).toLowerCase().includes(qs)))
      );
    }

    function groupByYear(posts) {
      const map = new Map();
      for (const p of posts) {
        const key = String(p.year ?? 'Unknown');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(p);
      }
      for (const arr of map.values()) {
        arr.sort((a, b) => b.dateMs - a.dateMs);
      }
      const years = Array.from(map.keys()).sort((a, b) => Number(b) - Number(a));
      return { map, years };
    }

    function renderLoading() {
      postListWrapper.setAttribute('aria-busy', 'true');
    }

    function renderError(msg) {
      postListWrapper.removeAttribute('aria-busy');
      postListWrapper.textContent = msg || 'Something went wrong.';
    }

    function renderPosts(posts) {
      postListWrapper.setAttribute('aria-busy', 'true');
      postListWrapper.innerHTML = '';

      const frag = document.createDocumentFragment();
      const { map, years } = groupByYear(posts);
      const fmt = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' });

      for (const year of years) {
        const section = document.createElement('section');

        const h2 = document.createElement('h2');
        h2.className = 'year-header';
        h2.textContent = year;
        section.appendChild(h2);

        const ul = document.createElement('ul');
        ul.className = 'post-list all-posts';

        for (const post of map.get(year)) {
          const li = document.createElement('li');
          li.className = 'post-list-item';

          const dateDiv = document.createElement('div');
          dateDiv.className = 'date-label';
          const d = post.date instanceof Date ? fmt.format(post.date) : '';
          dateDiv.textContent = d.replace(' ', '·');

          const a = document.createElement('a');
          a.className = 'post-link';
          a.setAttribute('href', post.href);
          a.textContent = post.title || '(Untitled)';

          li.appendChild(dateDiv);
          li.appendChild(a);
          ul.appendChild(li);
        }

        section.appendChild(ul);
        frag.appendChild(section);
      }

      postListWrapper.appendChild(frag);
      postListWrapper.removeAttribute('aria-busy');
    }

    function debounce(fn, delay) {
      let t;
      return function () {
        clearTimeout(t);
        const ctx = this, args = arguments;
        t = setTimeout(() => fn.apply(ctx, args), delay);
      };
    }
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();
