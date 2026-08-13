# About HuntTerminal

HuntTerminal is a web-based dork generation tool built for bug bounty hunters and offensive security practitioners. HuntTerminal provides a browser-based interface that allows users to select a search engine and automatically generate engine-specific dorks for structured passive reconnaissance against a target domain.

Instead of copying queries manually, users click on any generated dork, which opens a new browser tab and executes the search directly on the selected platform.

# What HuntTerminal Does

Input  : target domain<br>
Select : search engine<br>
Output : ready-to-use dorks (click to search)

| Engine     | Best for                                                  |
| ---------- | --------------------------------------------------------- |
| **Google** | Exposed files, config leaks, indexed admin panels, PDFs   |
| **Shodan** | Open ports, IoT devices, exposed services, SSL cert recon |
| **GitHub** | Leaked secrets, API keys, hardcoded credentials in code   |
| **FOFA**   | Asset discovery, exposed web apps, fingerprinting         |
| **Censys** | Internet-wide host scans, certs, banner data              |
| **Hunter** | Domain → email enumeration, asset attribution             |
| **ZoomEye**| Global asset search, strong APAC coverage                 |
| **Grep.app**| Regex code search across millions of public repos        |

# Features

- **8 search engines** wired up out of the box
- **100+ pre-built dorks** across categories: Information Disclosure, Exposed Cloud Storage (Azure Blob, AWS S3, GCS, Firebase), Leaked Secrets & Tokens, Login & Admin Panels, Vulnerable Endpoints, IoT & Industrial, Subdomain & Asset Discovery, Error Messages
- **Live target injection** — type your domain once, every dork on the page rewrites itself
- **One-click launch** — click any card, the query opens on its native engine in a new tab
- **Copy-to-clipboard** — grab the raw query if you want to paste it manually
- **Custom dork file loader** — point at any hosted JSON dork list and merge it into the library on the fly
- **Search & filter** — narrow by engine, dork type, or free-text search
- **Dark / light mode** — preference persists across sessions
- **Zero backend, zero tracking, zero API keys** — everything runs client-side
- **Works offline** once cloned

## How It Works

HuntTerminal runs entirely in your browser — no backend, no API keys, no tracking. The flow is three steps:

### 1. Select a Search Engine
Pick from Google, Shodan, GitHub, FOFA, Censys, Hunter, ZoomEye, or Grep.app. The page filters to show only dorks compatible with that engine.

### 2. Enter the Target Domain
Type the target (e.g. `example.com`) and click **Apply**. Every dork on the page rewrites itself with your target injected:

```
Before:  site:{TARGET} ext:env | ext:yml -git
After:   site:example.com ext:env | ext:yml -git
```

### 3. Select a Dork Type & Launch
Browse the dork categories — Information Disclosure, Exposed Cloud Storage, Leaked Secrets, Login Panels, Vulnerable Endpoints, IoT, Subdomain Discovery, Error Messages.

Each dork card shows:
- **The category tag** — what kind of finding the dork targets
- **The live query** — already injected with your target
- **Click anywhere on the card** — opens the search on the selected engine in a new tab
- **Copy icon inside the query box** — grabs the raw query for manual use

### Behind the Scenes
Every engine has its own URL template. When you click a card, HuntTerminal URL-encodes the dork (base64 for FOFA, since that's what its API expects) and launches the search in a new tab:

| Engine    | Launch URL pattern                                        |
| --------- | --------------------------------------------------------- |
| Google    | `google.com/search?q={DORK}`                              |
| Shodan    | `shodan.io/search?query={DORK}`                           |
| GitHub    | `github.com/search?q={DORK}&type=code`                    |
| FOFA      | `fofa.info/result?qbase64={DORK_B64}`                     |
| Censys    | `search.censys.io/search?resource=hosts&q={DORK}`         |
| Hunter    | `hunter.how/list?searchValue={DORK}`                      |
| ZoomEye   | `zoomeye.org/searchResult?q={DORK}`                       |
| Grep.app  | `grep.app/search?q={DORK}`                                |

# Clone & Run

Clone the repo:

```bash
git clone https://github.com/Saconyfx/HuntTerminal.git
cd HuntTerminal
```

## Option A — Just Double-Click It (easiest)

Open `index.html` by double-clicking it in your file explorer. It opens in your default browser and works immediately. Everything (CSS, JS, all 100 dorks) is inlined into that one file — no server, no dependencies, no build step, no internet required after cloning.

This is the recommended way to use HuntTerminal.

## Option B — Run a Local Server (for contributors)

If you want to edit the source files under `src/` and see changes without rebuilding every time, spin up a static local server:

### Python (built into most systems)

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### Node.js

```bash
npx serve .
# or
npx http-server -p 8000
```

### PHP

```bash
php -S localhost:8000
```

### VS Code

Install the **Live Server** extension → right-click `index.html` → "Open with Live Server."

Any static file server works. HuntTerminal makes no server-side calls at all — the server just needs to hand over files.

# Project Structure

```
HuntTerminal/
├── index.html              # THE APP — single self-contained file, run this
├── src/                    # source files for contributors
│   ├── index.template.html # HTML skeleton with build placeholders
│   ├── assets/
│   │   ├── css/style.css   # styles
│   │   └── js/app.js       # app logic
│   ├── data/
│   │   └── dorks.json      # the dork database
│   └── build.py            # rebuilds index.html from src/
├── LICENSE
└── README.md
```

- **End users** run `index.html` directly. Nothing else needed.
- **Contributors** edit files in `src/` and run `python3 src/build.py` to regenerate `index.html`.

# Adding New Dorks

Open `src/data/dorks.json` and append an entry:

```json
{
  "id": "sh-cloud-014",
  "engine": "shodan",
  "category": "Exposed Cloud Storage",
  "tag": "AWS S3",
  "query": "ssl.cert.subject.cn:\"s3.amazonaws.com\" hostname:{TARGET}"
}
```

Field rules:

- `id` — unique, engine-prefixed for readability
- `engine` — one of: `google`, `shodan`, `github`, `fofa`, `censys`, `hunter`, `zoomeye`, `grepapp`
- `category` — becomes the section header on the page
- `tag` — shown as the card's title
- `query` — the raw dork. Use `{TARGET}` anywhere the target domain should be injected

Then rebuild:

```bash
python3 src/build.py
```

That regenerates `index.html` with your new dorks baked in.

# Custom Dork Files (No Rebuild Needed)

The **Custom Dork File URL** field on the app lets you load your own dork list at runtime.

Host a JSON file anywhere (GitHub raw, gist, your own server) that follows the same schema as `src/data/dorks.json`, paste the URL, click **⚙ Generate**, and those dorks merge into the library live.

Useful for:
- Team-specific dork sets that shouldn't be public
- Program-specific dorks (e.g. dorks tuned for a particular bug bounty target)
- Trying out community-shared dork packs

# Modifying Styles or Logic

- CSS lives in `src/assets/css/style.css`. Uses CSS variables — swapping the theme is just a variable flip.
- JS lives in `src/assets/js/app.js`. Vanilla, no framework, no build tooling beyond the inline step in `build.py`.
- After editing either, run `python3 src/build.py` to regenerate `index.html`.

# Roadmap

- [ ] Expanded ZoomEye and Grep.app dork sets
- [ ] CTF / lab-mode dorks (HackTheBox, TryHackMe targets)
- [ ] Export selected dorks as a `.txt` recon playbook
- [ ] Bulk launch — open every dork in a category at once (with confirm modal)
- [ ] Browser extension: right-click a domain anywhere → HuntTerminal
- [ ] Community dork submissions via PRs against `src/data/dorks.json`

# Legal & Ethics

HuntTerminal is built for **authorized security testing** — bug bounty programs, internal pentests, red team engagements, CTFs, and recon on your own assets.

Running dorks against systems you don't own — or don't have written permission to test — may violate computer misuse laws in your jurisdiction (CFAA in the US, Computer Misuse Act in the UK, etc.). You are responsible for how you use this tool.

The dorks themselves only query **public search engines** — HuntTerminal never touches the target directly. But intent matters legally and ethically. Stay in scope.

# Credits

Built and maintained by **[saconyfx](https://github.com/Saconyfx)**.

Inspired by the Google Hacking Database (Exploit-DB), DorkSearch, and SecurityToolkit's "Dork For Me." HuntTerminal extends the concept across 8 engines, adds cloud-focused recon, and keeps the whole thing client-side.

# License

MIT — see `LICENSE`. Fork it, ship it, remix it.
