# Research topic lenses and metadata coverage

The explorer organizes OSDR Biological Data API records with nine overlapping subject-topic lenses. They are broad browsing categories generated from available metadata, not formal assignments or complete discipline inventories.

## Snapshot coverage

The snapshot retrieved 29 October 2026 contains all **645 accessions returned by the Biological Data API dataset listing**. The aggregate-metadata endpoint returned metadata for 644 records; 527 records include a publication title. Counts below are generated from the snapshot and intentionally overlap.

| Research topic | Records with a metadata signal | Signal used by the current tagger |
| --- | ---: | --- |
| Animals & model organisms | 312 | Organism or material terms for common model animals and tissue-on-chip work |
| AI & computational methods | 11 | Artificial intelligence, machine learning, deep learning, or neural-network terms |
| Physiology & archive data | 84 | API source-type field identifies ALSDA records |
| Reproductive health | 5 | Reproductive, ovarian, uterine, endocrine, fertility, pregnancy, or gamete terms |
| Human spaceflight health | 275 | Human, Homo sapiens, astronaut, or crew terms |
| Microbial systems | 134 | Microbe, bacteria, virus, fungi, yeast, archaea, phage, and related organism terms |
| Multi-omics | 340 | Molecular assay-family terms such as transcriptomics, proteomics, or metabolomics |
| Plant biology | 100 | Plant organism names and plant-structure terms |
| Radiation & dosimetry | 175 | Radiation, dosimetry, ionizing, particle, proton, and heavy-ion terms |

These are rule-based **metadata-topic matches**, not counts of unique research areas, publications, or complete scientific coverage. A record may match several topics. A missing tag means only that the available fields did not match the current rules; it does not mean the record is irrelevant.

The research page includes one scope-derived review direction and available publication-title screening leads per topic. These are not verified paper-to-dataset relationships, established gaps, or findings from a completed evidence review.

The radiation topic matches radiation-related text in Biological Data API records; it does **not** ingest the separate RadLab telemetry service. The physiology-and-archive topic uses the API source label for ALSDA records.

## Research-gap graph coverage

The interactive evidence graph currently contains the curated Brain pilot only. Its 30 literature records, 63 accessions, and proposed links have not been expanded into complete, expert-reviewed maps across all subject areas. The all-record visual map is the broad metadata discovery layer; a verified gap graph requires literature searching, a screening log, source verification, gap provenance, and sample-level feasibility review.

## Sources

The [NASA Biological Data API documentation](https://visualization.osdr.nasa.gov/biodata/api/) documents the dataset, metadata, and wildcard endpoints used by this snapshot. The API covers GeneLab and ALSDA, not every separate OSDR service. See [data-source coverage](DATA_SOURCES.md) for the current integration matrix.
