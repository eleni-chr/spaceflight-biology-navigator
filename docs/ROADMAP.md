# Development roadmap

## Stage 0 — public visual map and explorer shipped

- [x] GitHub-ready static site with a searchable all-record OSDR Biological Data API snapshot.
- [x] Current accession index and aggregate metadata for GeneLab/ALSDA.
- [x] Nine overlapping subject-topic filters with record-level evidence strings.
- [x] Interactive network map linking all snapshot records to nine overlapping topic lenses and showing shared metadata matches.
- [x] Homepage gap-hypothesis view across the nine topic lenses with source context where available and metadata-selected dataset leads; labels explicitly remain screening-only.
- [x] Topic-level review directions and publication-title leads for screening; these are not verified gaps.
- [x] Search, source and topic filters, record links, descriptions, and filtered CSV export.
- [x] Separate interactive Brain evidence-graph pilot and its source ledgers.
- [x] Snapshot refresh utility and GitHub Pages workflows.

## Stage 1 — broader OSDR service coverage

- [ ] Add adapters for RadLab telemetry, environmental data, NBISC, SMCC, and other separate services.
- [ ] Define source-specific data/access policies, stable identifiers, and retrieval dates.
- [ ] Reconcile aliases and study-family grouping across services.
- [ ] Summarize assays, samples, and biological units where publicly accessible and authorized.

## Stage 2 — publication and research-gap audit

- [ ] Build an exhaustive publication inventory using OSDR metadata, PubMed, Crossref, OpenAlex, PMC, and permitted full text.
- [ ] Track search/query coverage, dates, exclusions, and DOI deduplication.
- [ ] Differentiate original, secondary, poster, preprint, and bibliographic mentions.
- [ ] Record author-stated vs analyst-inferred gaps with direct source evidence.
- [ ] Validate publication–dataset relationships against full text or trusted repository metadata.

## Stage 3 — reviewed evidence graph

- [ ] Extend curated graph coverage from the Brain pilot across subject areas.
- [ ] Identify later papers that narrow or resolve earlier questions with reviewer adjudication.
- [ ] Move from static JSON to relational entity/edge history.
- [ ] Build review UI and evidence/provenance exports.

## Stage 4 — candidate dataset assessment

- [ ] Match datasets to unresolved questions using measured variables, design, and metadata gates.
- [ ] Check organism, tissue, assay, exposure, controls, biological replication, access, and independent validation before text ranking.
- [ ] Benchmark suggestions on a manually curated reference set.
- [ ] Quantify false-positive rate and agreement between independent curators.

## Stage 5 — public research service

- [ ] Publish a versioned catalog and literature-coverage dashboard.
- [ ] Add dataset previews, saved views, and API.
- [ ] Schedule source monitoring with manual approval of scientific changes.
- [ ] Establish transparent project governance and review policy.
