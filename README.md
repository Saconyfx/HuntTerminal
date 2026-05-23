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

## How It Works

HuntTerminal runs entirely in your browser — no backend, no API keys, no tracking. The flow is three steps:

### 1. Select a Search Engine
Pick from Google, Shodan, GitHub, FOFA, Censys, Hunter, ZoomEye, or Grep.app. The page filters to show only dorks compatible with that engine.

### 2. Enter the Target Domain
Type the target (e.g. `example.com`) and click **Apply**. Every dork on the page rewrites itself with your target injected:

### 3. Select a Dork Type & Launch
Browse the dork categories — Information Disclosure, Exposed Cloud Storage, Leaked Secrets, Login Panels, Vulnerable Endpoints, IoT, Subdomain Discovery, Error Messages.


Each dork card shows:
- **Severity tag** — high / medium / low, color-coded
- **The live query** — already injected with your target
- **Run button** — opens the search on the selected engine in a new tab
- **Copy button** — grabs the raw query for manual use


### Behind the Scenes

Every engine has its own URL template. When you click **Run**, HuntTerminal URL-encodes the dork (base64 for FOFA, since that's what its API expects) and launches the search in a new tab:

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
