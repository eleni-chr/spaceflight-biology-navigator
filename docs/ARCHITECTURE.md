# Architecture and data model

## Purpose

Spaceflight Biology Navigator is an independent discovery project for public NASA OSDR research. The homepage opens to a cross-topic view of analyst-inferred research-question hypotheses and metadata-selected OSDR dataset leads. A second view shows the metadata network of all records and nine overlapping topic lenses; a separate explorer supports detailed search and export. The interactive evidence graph remains a clearly labeled Brain case study.

## Current implementation

- `web/index.html`, `web/map.js`, and `web/map.css`: interactive cross-topic map with a gap-hypothesis/dataset-lead view and a complete metadata-network view, search, pan/zoom, source links, and record detail panels.
- `web/explorer.html` and `web/catalog-app.js`: searchable all-record explorer with topic and source filters and filtered CSV export.
- `web/brain-pilot.html` and `web/app.js`: interactive SVG evidence graph for the curated Brain case study, with study, dataset, and relationship detail panels.
- `web/about.html`: snapshot counts, source coverage, topic-tagging method, and evidence limits.
- `data/catalog/osdr_biodata_snapshot.json`: normalized API snapshot. `web/data/catalog.js` is its browser-ready representation.
- `data/seed/cross_topic_gap_hypotheses.json`: analyst-inferred screening questions with source context where available. Dataset leads are generated dynamically from the snapshot's topic matches; they are not feasibility-reviewed.
- `spacebio.osdr`: index and metadata normalization, topic definitions, and explainable keyword/source rules.
- `spacebio.cli catalog`: refreshes the API index and aggregate metadata.
- `spacebio.literature`: candidate discovery by accession; not a citation resolver.
- `pubmed-batch`: resumable, rate-limited candidate search across the catalog; results remain unverified associations.
- `spacebio.quality`: graph referential and schema checks only; it does not verify scientific claims.

## Topic-tagging policy

Topic suggestions are generated from available metadata using transparent, overlapping keyword and source-label rules. Each record exposes an evidence string describing the terms that triggered a suggestion. These labels are discovery aids, not formal classifications or review decisions. Current rules and counts are in `docs/TOPIC_LENSES.md`.

## Brain graph seed contract

The current evidence graph is `data/seed/brain_pilot.json`, a separate curated JSON document with `scope`, `papers`, `datasets`, `themes`, canvas dimensions, and edge totals. The browser graph uses stable IDs, typed relationship lists, evidence text, and coordinates. A top-level `scope` object drives graph-page labels. The CLI validates internal references and totals before generating browser JavaScript. Those checks do not verify scientific claims.

The cross-topic view does not reuse the Brain graph's paper-to-dataset relationships. It presents a question hypothesis and a short metadata-based accession list for each topic lens. It must remain labeled as screening until publication coverage and sample-level compatibility have been reviewed.

## Target research entities

The eventual evidence graph should make these first-class objects:

- `Dataset`: accession(s), mission, organism, tissue, assay, samples, factors, access policy, and metadata provenance.
- `Experiment`: study family, exposure, controls, independent replicate count, randomization, and recovery conditions.
- `Publication`: DOI/PMID, version, status (original/secondary/preprint/poster), publication date, and relationship to OSDR source record.
- `Finding`: concise claim plus evidence pointer and methodological qualification.
- `ResearchGap`: one sentence, author-stated vs analyst-inferred, status, and last-reviewed time.
- `Relationship`: typed edge with evidence URL, curator decision, confidence basis, timestamps, and counterevidence.
- `CandidateAnalysis`: a gap linked to candidate datasets, required contrasts, assay match, power assumptions, and limitations.
- `Review`: reviewer identity, rationale, method, and timestamp.

Subject topics should remain many-to-many tags. Dataset and publication identity must not depend on topical labeling.

## Remaining service work

1. Add separate adapters for RadLab telemetry, environmental data, NBISC, SMCC, and other in-scope services.
2. Reconcile accession aliases and study-family grouping across services.
3. Build an exhaustive publication index and screening ledger across subject areas.
4. Curate source-backed findings and gaps, distinguishing author-stated questions from analyst hypotheses.
5. Assess candidate datasets using organism, tissue, assays, controls, biological units, sample access, and independent validation.
6. Add a review interface, versioned provenance exports, and monitoring for curator-approved changes.
