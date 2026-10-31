# Data sources and coverage

Spaceflight Biology Navigator is intended to help the public explore NASA OSDR research. The default visual map uses a dated snapshot of the NASA OSDR Biological Data API, which indexes GeneLab and ALSDA. Other OSDR services remain separate integrations.

## Current snapshot

Retrieved **29 October 2026** from the official API:

| Source | Records | Fields indexed | Status |
| --- | ---: | --- | --- |
| [`/v2/datasets/`](https://visualization.osdr.nasa.gov/biodata/api/v2/datasets/) | 645 accessions | Stable accession and record/API links | Bundled in `web/data/catalog.js` |
| [`/v2/dataset/*/metadata/`](https://visualization.osdr.nasa.gov/biodata/api/) | 644 records with aggregate metadata | Study and project titles, publication title/authors when available, organism, mission, assay, factors, source type, description, and links | Bundled in the same snapshot |
| Publication metadata field | 527 records with a title | Title/author values supplied in NASA OSDR metadata | Shown as metadata; not independently verified as sample-level use |

The API documents the dataset listing and wildcard metadata endpoints. The snapshot contains every accession returned by that listing on the retrieval date; it is not a complete inventory of all OSDR services or a complete publication/research-gap audit.

## Research-topic filters

The nine subject-topic filters use transparent, overlapping keyword rules; the physiology/archive topic also uses the API's source-type field. They are discovery aids only. See [topic lens coverage](TOPIC_LENSES.md) for counts, rules, and limits.

## Refresh the snapshot

From the repository root:

```bash
py -3 -m spacebio.cli catalog --site-out web/data/catalog.js
```

On macOS/Linux, use `python3`. The command fetches the dataset index and wildcard aggregate metadata, then updates `data/catalog/osdr_biodata_snapshot.json` and the browser file. The snapshot stores retrieval time and a SHA-256 digest of the fetched API responses. Review record counts and the coverage note before publishing.

## Separate OSDR services not yet ingested

| Source | Data scope | Current integration |
| --- | --- | --- |
| [RadLab data API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) | Radiation dosimetry and telemetry measurements | Linked as a source; not yet fetched into the snapshot. The radiation topic only matches related text in Biological Data API records. |
| NASA Environmental Data Application | Mission and cabin environmental telemetry | Not ingested; source-specific adapter needed. |
| [NBISC](https://visualization.osdr.nasa.gov/) | Biospecimen search/request metadata | Not ingested; its access model and schema need a separate adapter. |
| SMCC | Space Microbial Culture Collection | Not ingested; collection records need a separate adapter. |
| Other NASA OSDR tools and repositories | Additional data types and visualizations | Not ingested; inventory and coverage review needed. |

NASA's [OSDR portal](https://visualization.osdr.nasa.gov/) links to these separate services. A future cross-service catalog should preserve each service's own identifiers, terms, refresh dates, and access restrictions.

## Literature and evidence scope

The interactive graph remains a Brain pilot and does not establish exhaustive publication coverage. PubMed CLI output is candidate discovery only. A publication title in NASA metadata is not by itself proof that the publication used every assay, sample, or result in a dataset record.

A dataset–question edge remains proposed until sample structure, assay compatibility, controls, independent replication, access status, and question fit have been reviewed. Do not ingest controlled-access, private, or identifiable research data.
