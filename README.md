# LDS Gospel Study Archive & Scripture Cross-Reference App

Welcome to your **LDS Gospel Study Archive**! This is a modern, premium static web application designed to host, index, and explore your personal gospel journal articles while integrating them with the LDS standard works (Old Testament, New Testament, Book of Mormon, Doctrine and Covenants, and Pearl of Great Price).

## Features

- **Interactive Study Dashboard**: View high-level statistics of your study history, including dynamic charts (powered by Chart.js) showing which volumes and books you've referenced the most, a dynamic tag cloud, and recent articles.
- **Advanced Article Search**: Fast, client-side, multi-faceted search that lets you find journal entries by keyword, filter by date ranges, explore specific tags, or locate entries by referenced scripture.
- **Cross-Referenced Scripture Reader**: A beautiful, distraction-free scripture reading environment. When a verse has been referenced in one of your articles, it is highlighted. Clicking the verse or its footnote indicator opens an elegant sliding panel displaying the full journal entries discussing that verse.
- **Rich Aesthetics**: Premium, responsive glassmorphism design with a dark/light mode toggle, custom typography (Montserrat/Outfit), smooth micro-animations, and custom color harmonies.
- **Autodeploy Pipeline**: Powered by GitHub Actions. Whenever you push an update to your journals, the pipeline automatically parses the RTF, indexes scripture references, compiles statistics, and redeploys the updated static pages.

---

## Directory Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions autodeploy workflow
├── assets/                     # Raw study assets (RTFs and TXTs)
│   ├── journals/               # Gospel Study Journal RTFs
│   └── scriptures/             # Standard Works raw text files
├── scripts/                    # Python pipeline scripts
│   ├── parse_journals.py       # RTF Journal parser & article extractor
│   ├── parse_scriptures.py     # Scripture raw TXT parser
│   └── build_index.py          # Cross-reference compiler & stats builder
├── data/                       # Structured JSON databases (auto-generated)
│   ├── articles.json           # All extracted study articles
│   ├── scriptures/             # Individual JSON databases by scripture volume
│   │   ├── ot.json, nt.json, bofm.json, dc.json, pgp.json
│   ├── scripture_refs.json     # Scripture verse-to-article lookup index
│   └── stats.json              # Dashboard analytics & charts data
├── css/
│   └── style.css               # Core styling (glassmorphism, variables, responsive design)
├── js/
│   ├── app.js                  # Main controller, search, dashboard charts
│   └── reader.js               # Scripture reader & footnote side panel
├── index.html                  # Dashboard & Journal Article Browser
├── scriptures.html             # Interactive Scripture Reader
└── README.md                   # You are here!
```

---

## Technical Pipeline

The application processes your raw study data in three stages using `uv`, a super fast Python package manager:

1. **Journal Parsing**: Reads exported RTF files from Google Docs, parses their internal style directives (`\s1` for date, `\s2` for title, `\s16` for metadata/references, `\s0` for body), and extracts structured article components.
2. **Scripture Parsing**: Converts raw scriptures text files into structured chapter/verse JSON objects grouped by volume to enable fast, modular loading.
3. **Cross-Referencing**: Uses dynamically generated regular expressions built from LDS canon book names and abbreviations to scan your articles. It maps which verses you reference and builds statistical indices for the dashboard.

---

## Getting Started

### Prerequisites

Make sure you have **Python 3** and **uv** installed.
To verify:
```bash
python --version
uv --version
```

### Running the Parsing Pipeline

To extract all articles and compile the database, run the following commands:

```bash
# 1. Parse scriptures text into structured JSON volumes
uv run python scripts/parse_scriptures.py

# 2. Parse the journal RTF files and extract articles
uv run python scripts/parse_journals.py

# 3. Scan articles for scripture references, compile footnotes and stats
uv run python scripts/build_index.py
```

### Running Locally

Since the application uses standard `fetch` API to load JSON data dynamically on demand, it must be run from a local development server to bypass CORS restrictions.

You can launch a simple local development server using Python's built-in server:
```bash
python -m http.server 8000
```
Then, open [http://localhost:8000](http://localhost:8000) in your web browser.

---

## Deployment to GitHub Pages

The project includes an automatic deployment workflow. When you push your files to GitHub, the Actions runner will install Python and `uv`, rebuild your entire database from your RTF journals, and host the updated static pages on GitHub Pages under your repository URL.
