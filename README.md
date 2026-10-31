# Spaceflight Biology Navigator

**An independent, public-facing visual discovery map for NASA Open Science Data Repository (OSDR) biological research.** The map connects public dataset records to overlapping research topics using signals in the available metadata.

## Current release

The homepage is an interactive network map of all **645 accessions** in the NASA OSDR Biological Data API snapshot retrieved on **29 October 2026**. It shows nine overlapping topic lenses and lets readers inspect a record, its metadata match terms, any publication title listed in the record, and the NASA source page. Visitors can search, focus a topic, inspect shared-topic overlaps, and pan or zoom the network.

This is a broad metadata-discovery map, not a completed literature census or verified research-gap map. Topic links are screening signals. A publication title in a NASA record does not prove that the paper used every sample or assay in that record. The separate Brain evidence case study contains curated study-level evidence; it is not represented as complete coverage of all topics. The project is independent and is **not an official NASA product**.

## Explore

- **Visual research map:** [`web/index.html`](web/index.html) is the default experience and maps all dataset records across the nine topic lenses.
- **All-record explorer:** [`web/explorer.html`](web/explorer.html) searches accessions, study and publication titles, authors, organisms, missions, assays, factors, and descriptions; it also supports filters and CSV export.
- **Brain evidence case study:** [`web/brain-pilot.html`](web/brain-pilot.html) displays a focused, curated evidence graph with source notes and proposed follow-up links.
- **About and methods:** [`web/about.html`](web/about.html), [topic lens coverage](docs/TOPIC_LENSES.md), [data-source coverage](docs/DATA_SOURCES.md), [evidence policy](docs/EVIDENCE.md), [architecture](docs/ARCHITECTURE.md), and [roadmap](docs/ROADMAP.md).

The static site works offline. From the repository root, start a local server:

```bash
python3 -m http.server 8000 --directory web
```

On Windows, use `py -3 -m http.server 8000 --directory web` if `python3` is unavailable. Then open http://localhost:8000.

## Refresh the catalog snapshot

From the repository root:

```bash
py -3 -m spacebio.cli catalog --site-out web/data/catalog.js
```

On macOS/Linux, use `python3` in place of `py -3`. This fetches the Biological Data API dataset index and aggregate metadata. It updates `data/catalog/osdr_biodata_snapshot.json` and `web/data/catalog.js`. Review the retrieval date, source hash, record count, and coverage note before committing.

The bundled API snapshot covers GeneLab and ALSDA records. Other OSDR services, including RadLab, the Environmental Data Application, NBISC, and SMCC, use separate systems and are not included in this snapshot. See [source coverage](docs/DATA_SOURCES.md).

## Research utilities

The repository uses Python 3.10+ and only the standard library:

```bash
py -3 -m spacebio.cli validate
py -3 -m spacebio.cli build
py -3 -m spacebio.cli build --check
py -3 -m spacebio.cli catalog --site-out web/data/catalog.js
py -3 -m spacebio.cli pubmed OSD-352
py -3 -m spacebio.cli pubmed-batch
```

`validate` and `build` accept `--seed PATH`; `build` also accepts `--out PATH`. `pubmed-batch` searches accession identifiers from the bundled catalog, saves progress, and resumes on rerun. Results are **unverified candidates**, not confirmed publication–dataset relationships. Set `SPACEFLIGHT_BIOLOGY_NCBI_EMAIL` or pass `--email` to provide NCBI contact metadata.

## Hosting

The site is static and can be served from GitHub Pages. The included workflow in `.github/workflows/deploy-pages.yml` validates the project and deploys the `web/` site. To host a fork, set the repository's Pages source to **GitHub Actions**. No API key or server-side service is required to view the bundled snapshot.

Citation metadata is provided in [`CITATION.cff`](CITATION.cff).

## Evidence and data boundaries

A publication title shown in NASA metadata does not by itself prove that a paper used every assay or sample in that record. Keyword overlap is only a discovery aid; it does not prove novelty, a research gap, or dataset feasibility. The Brain evidence graph keeps documented use and proposed links visually separate. Broader literature reconciliation and expert-reviewed gap links require source review and curator adjudication.

Do not commit credentials, controlled-access data, private participant records, or full text you are not permitted to redistribute. The MIT licence applies to original project code, not to linked papers or NASA datasets.
