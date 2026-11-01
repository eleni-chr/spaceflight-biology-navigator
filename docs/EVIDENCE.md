# Evidence, scope and validation policy

## This release

The homepage now includes nine cross-topic screening hypotheses in `data/seed/cross_topic_gap_hypotheses.json`. These are analyst-inferred research directions, not claims that the questions are novel or remain unresolved. Source links give context for the directions where a relevant primary study was identified; they do not constitute a systematic literature search. The computational-methods question has no topic-specific source audit yet.

The homepage's dataset leads are selected from the bundled OSDR metadata snapshot using the same topic-lens matches shown in the metadata network. The short list is ordered by how many aggregate metadata fields are populated, not by scientific relevance or fitness for a question. These are not scientific recommendations, verified paper–dataset relationships, or feasibility-reviewed experiments. A reader must inspect the study record and sample-level files before deciding whether a record can address a question. The generated `web/data/gap-hypotheses.js` file is built with `python -m spacebio.cli build-gaps`.

The Brain seed comes from an earlier 63-accession working inventory and 30 literature records (including non-journal items). It is not an exhaustive literature audit; several links retain "carry forward" status from earlier review. The original audit exports and log are retained under `data/seed/`.

The seed is not proof of novelty, data availability for all assays, functional relevance, paired animals, or the ability of any candidate dataset to resolve a gap.

## Suggested evidence classes for the future database

| Class | Meaning | Minimum evidence |
| --- | --- | --- |
| `DIRECT_PUBLICATION_DATASET` | A paper explicitly cites/reuses an accession | DOI/full-text methods or OSDR publication linkage |
| `RECONSTRUCTED_SOURCE_DATA` | Accession is related through GEO or other original source | Primary repository accession and mapping evidence |
| `MISSION_OR_TOPIC_RELATED` | Studies share a mission/biology theme | Mission or ontology metadata (not sample matching) |
| `PAPER_ADDRESSES_GAP` | Later work investigates an earlier question | Explicit scope/result comparison with limitation stated |
| `CANDIDATE_GAP_DATASET` | Hypothesis that data could answer an open question | Candidate assay, relevant metadata and missing feasibility gates |
| `REVIEWED_FEASIBLE` | Curator has reviewed independent replicates/contrast feasibility | Written design and biological caveats |

The present JSON preserves most but not all of these distinctions; full migration is planned.

## Publication-screening protocol

1. Define inclusion criteria and snapshot API date.
2. Enumerate OSDR catalogue records including ALSDA/GeneLab modalities and accession aliases.
3. For each study, search attached publication metadata, DOI/PMID indexes and forward/backward citations.
4. Distinguish primary data generation, later secondary analysis, preprints, posters and mere mentions.
5. Keep a deduplicated screening ledger with reasons for inclusion/exclusion.
6. For every finding and gap, save an evidence span/page or source anchor where copyright permits.
7. Re-run searches periodically and mark unresolved association separately from 'unpublished'.

## Feasibility gate for proposed gap→dataset edges

- Is the biological question operationalised by measured variables?
- Are tissue, species, sex, age, exposure and assay modalities compatible?
- Are group assignments and experimental controls accessible?
- Are independently replicated units correctly identified (animals vs cells)?
- Is there a legitimate independent validation cohort?
- Are sampling time and recovery confounded with duration of exposure?
- Is data access lawful and actually public for the proposed analysis?
- Can the analysis test a mechanistic claim or only association?

**Until these questions are answered, show only a dashed proposed edge.**
