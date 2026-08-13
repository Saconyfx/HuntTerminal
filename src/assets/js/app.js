/* =============================================================
   HuntTerminal — app.js
   Loads dorks, handles target injection, filtering, search,
   copy-to-clipboard, and one-click launch to each engine.
   ============================================================= */

(() => {
  'use strict';

  // ----- Engine metadata: pretty name + launch URL template -----
  const ENGINES = {
    google:   { name: 'Google',   url: q => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
    shodan:   { name: 'Shodan',   url: q => `https://www.shodan.io/search?query=${encodeURIComponent(q)}` },
    github:   { name: 'GitHub',   url: q => `https://github.com/search?q=${encodeURIComponent(q)}&type=code` },
    fofa:     { name: 'FOFA',     url: q => `https://fofa.info/result?qbase64=${btoa(unescape(encodeURIComponent(q)))}` },
    censys:   { name: 'Censys',   url: q => `https://search.censys.io/search?resource=hosts&q=${encodeURIComponent(q)}` },
    hunter:   { name: 'Hunter',   url: q => `https://hunter.how/list?searchValue=${encodeURIComponent(q)}` },
    zoomeye:  { name: 'ZoomEye',  url: q => `https://www.zoomeye.org/searchResult?q=${encodeURIComponent(q)}` },
    grepapp:  { name: 'Grep.app', url: q => `https://grep.app/search?q=${encodeURIComponent(q)}` }
  };

  // ----- State -----
  const state = {
    dorks: [],
    target: 'example.com',
    engine: 'all',
    category: 'all',
    search: ''
  };

  // ----- DOM refs -----
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  const els = {
    engineSel:   $('#engine'),
    targetInp:   $('#target'),
    applyBtn:    $('#apply'),
    dorkTypeSel: $('#dork-type'),
    customUrl:   $('#custom-url'),
    generateBtn: $('#generate'),
    searchInp:   $('#search'),
    catChips:    $('#cat-chips'),
    status:      $('#status'),
    results:     $('#results'),
    themeBtn:    $('#theme-toggle'),
    toast:       $('#toast')
  };

  // ----- Boot -----
  async function init() {
    bindUI();
    loadTheme();
    try {
      const res = await fetch('data/dorks.json');
      state.dorks = await res.json();
    } catch (err) {
      console.error('Failed to load dorks.json:', err);
      els.results.innerHTML = `<div class="empty">Failed to load dork database. Run via a local server (python3 -m http.server).</div>`;
      return;
    }
    populateDorkTypes();
    render();
  }

  function bindUI() {
    els.engineSel.addEventListener('change', e => { state.engine = e.target.value; populateDorkTypes(); render(); });
    els.applyBtn.addEventListener('click', applyTarget);
    els.targetInp.addEventListener('keydown', e => { if (e.key === 'Enter') applyTarget(); });
    if (els.dorkTypeSel) els.dorkTypeSel.addEventListener('change', e => { state.category = e.target.value; render(); });
    if (els.generateBtn) els.generateBtn.addEventListener('click', onGenerate);
    if (els.searchInp) els.searchInp.addEventListener('input', e => { state.search = e.target.value.trim().toLowerCase(); render(); });
    els.themeBtn.addEventListener('click', toggleTheme);
  }

  // Populate the Dork Type dropdown from currently available categories
  function populateDorkTypes() {
    if (!els.dorkTypeSel) return;
    const relevant = state.engine === 'all'
      ? state.dorks
      : state.dorks.filter(d => d.engine === state.engine);
    const cats = [...new Set(relevant.map(d => d.category))].sort();
    const current = state.category;
    els.dorkTypeSel.innerHTML =
      `<option value="all">-- All Dork Types --</option>` +
      cats.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
    // preserve selection if still valid
    if (cats.includes(current)) {
      els.dorkTypeSel.value = current;
    } else {
      state.category = 'all';
      els.dorkTypeSel.value = 'all';
    }
  }

  // Generate = load a custom JSON dork file from URL and merge into the library
  async function onGenerate() {
    const url = (els.customUrl.value || '').trim();
    if (!url) { toast('Enter a dork file URL first'); return; }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid format — expected JSON array');
      // basic normalization: require engine + category + query
      const valid = data.filter(d => d && d.engine && d.category && d.query);
      state.dorks = [...state.dorks, ...valid];
      populateDorkTypes();
      render();
      toast(`Loaded ${valid.length} custom dorks`);
    } catch (err) {
      console.error(err);
      toast(`Load failed: ${err.message}`);
    }
  }

  function applyTarget() {
    const v = els.targetInp.value.trim();
    state.target = v || 'example.com';
    render();
    toast(`Target locked: ${state.target}`);
  }

  // ----- Category chips (built from data) -----
  function buildCategoryChips() {
    const cats = ['all', ...new Set(state.dorks.map(d => d.category))];
    els.catChips.innerHTML = cats.map(c =>
      `<button class="chip ${c === 'all' ? 'active' : ''}" data-cat="${escapeAttr(c)}">${c === 'all' ? 'All Categories' : c}</button>`
    ).join('');
    els.catChips.addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      $$('#cat-chips .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      state.category = c.dataset.cat;
      render();
    });
  }

  // ----- Filtering -----
  function filtered() {
    const t = state.target;
    return state.dorks
      .filter(d => state.engine === 'all' || d.engine === state.engine)
      .filter(d => state.category === 'all' || d.category === state.category)
      .filter(d => {
        if (!state.search) return true;
        const blob = `${d.tag || ''} ${d.category} ${d.query}`.toLowerCase();
        return blob.includes(state.search);
      })
      .map(d => ({ ...d, query: d.query.replaceAll('{TARGET}', t) }));
  }

  // ----- Render -----
  function render() {
    const list = filtered();
    els.status.innerHTML = `Loaded <span class="num">${list.length}</span> / <span class="num">${state.dorks.length}</span> dorks · target: <span class="num">${escapeHtml(state.target)}</span> · engine: <span class="num">${state.engine === 'all' ? 'all' : ENGINES[state.engine].name}</span>`;

    if (!list.length) {
      els.results.innerHTML = `<div class="empty">No dorks match the current filters.</div>`;
      return;
    }

    // group by category
    const groups = {};
    list.forEach(d => { (groups[d.category] = groups[d.category] || []).push(d); });

    els.results.innerHTML = Object.entries(groups).map(([cat, items]) => `
      <section class="category-block reveal">
        <h2 class="category-title">${escapeHtml(cat)} <span class="count">${items.length}</span></h2>
        <div class="grid">
          ${items.map(renderCard).join('')}
        </div>
      </section>
    `).join('');

    // bind: whole card runs, copy button copies (stop propagation)
    els.results.querySelectorAll('.card').forEach(c => c.addEventListener('click', onRun));
    els.results.querySelectorAll('[data-act="copy"]').forEach(b => {
      b.addEventListener('click', e => { e.stopPropagation(); onCopy(e); });
    });
  }

  function renderCard(d) {
    return `
      <article class="card" data-engine="${d.engine}" data-query="${escapeAttr(d.query)}" title="Click to run on the target engine">
        <div class="card-cat">${escapeHtml(d.tag)}</div>
        <div class="card-query-wrap">
          <pre class="card-query">${escapeHtml(d.query)}</pre>
          <button class="copy-btn" data-act="copy" data-query="${escapeAttr(d.query)}" title="Copy dork" aria-label="Copy">⧉</button>
        </div>
      </article>
    `;
  }

  // ----- Actions -----
  function onRun(e) {
    const card = e.currentTarget;
    const eng = card.dataset.engine;
    const q   = card.dataset.query;
    const url = ENGINES[eng].url(q);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function onCopy(e) {
    const q = e.currentTarget.dataset.query;
    try {
      await navigator.clipboard.writeText(q);
      toast('Copied to clipboard');
    } catch {
      // fallback: textarea select+copy
      const ta = document.createElement('textarea');
      ta.value = q; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
      toast('Copied to clipboard');
    }
  }

  // ----- Theme -----
  function loadTheme() {
    const t = localStorage.getItem('ht-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
    els.themeBtn.textContent = t === 'dark' ? '☼ light' : '☾ dark';
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ht-theme', next);
    els.themeBtn.textContent = next === 'dark' ? '☼ light' : '☾ dark';
  }

  // ----- Toast -----
  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2000);
  }

  // ----- Helpers -----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replaceAll('\n', '&#10;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
