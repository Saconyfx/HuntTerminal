#!/usr/bin/env python3
"""
HuntTerminal build script.

Reads: src/assets/css/style.css, src/assets/js/app.js, src/data/dorks.json, src/index.template.html
Writes: index.html (single-file, self-contained — double-click to run)

Usage:
    python3 src/build.py
"""

import json
from pathlib import Path

# Project root = one level up from this script
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

# Read source files
dorks_json = (SRC / 'data' / 'dorks.json').read_text()
css        = (SRC / 'assets' / 'css' / 'style.css').read_text()
js         = (SRC / 'assets' / 'js' / 'app.js').read_text()
tpl        = (SRC / 'index.template.html').read_text()

# Swap the fetch() call in the JS with an inlined data reference
js_inlined = js.replace(
    """try {
      const res = await fetch('data/dorks.json');
      state.dorks = await res.json();
    } catch (err) {
      console.error('Failed to load dorks.json:', err);
      els.results.innerHTML = `<div class="empty">Failed to load dork database. Run via a local server (python3 -m http.server).</div>`;
      return;
    }""",
    "state.dorks = window.__DORKS__;"
)

# Fill the template
html_out = tpl.replace('/*__STYLES__*/', css)
html_out = html_out.replace('/*__DORKS__*/', dorks_json)
html_out = html_out.replace('/*__APP__*/', js_inlined)

# Write the final single-file build to project root
out_path = ROOT / 'index.html'
out_path.write_text(html_out)

print(f"Built: {out_path} ({len(html_out):,} bytes)")
