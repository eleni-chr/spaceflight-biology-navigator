# Contributing

Contributions to both the software and the scientific evidence ledger are welcome.

- Open an issue describing the intended change, source and expected impact.
- Use the **Research record correction or addition** issue form for changes to publications, dataset links, findings, gaps or evidence classifications.
- For publication–dataset associations, supply DOI/publication URL, exact accession, source citation and whether the link is a direct citation or reconstructed metadata relationship.
- For a gap-to-dataset suggestion, explain what measurements and contrasts exist, the relevant controls, independent replicates and known limitations. Do not mark it scientifically validated without expert review.
- Never submit copyrighted full text, licensed datasets, controlled-access astronaut data or private subject records into the public repo.
- Run `python3 -m unittest discover -s tests -v`, `python3 -m spacebio.cli validate`, and `python3 -m spacebio.cli build --check` before submitting.
- Update `data/seed/brain_pilot.json` and regenerate `web/data/seed.js` with `python3 -m spacebio.cli build`.
- Refresh the OSDR biological dataset snapshot with `python3 -m spacebio.cli catalog --site-out web/data/catalog.js`; inspect the source date and coverage note before committing it.
- PubMed batch searches are rate-limited and resumable. Review NCBI's [scripting guidance](https://www.ncbi.nlm.nih.gov/home/about/policies/) before launching large search series; candidate hits must be screened before adding evidence links.
- Keep credit for original papers, NASA data and third-party contributors explicit.

This early release has no formal governance board. Establish a review policy and record qualified review evidence before marking scientific claims as verified.
