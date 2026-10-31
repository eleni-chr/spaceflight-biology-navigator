"""PubMed candidate discovery for datasets; review required before linking.

PubMed is one literature source; this helper is NOT an exhaustive citation
search, and its results must not be treated as confirmed dataset reuse.
"""
from __future__ import annotations

import json
import os
import re
import urllib.parse
import urllib.request
from typing import Any

PUBMED_ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
ACCESSION = re.compile(r'^OSD-\d+$', re.IGNORECASE)


def make_query(accession: str) -> str:
    if not ACCESSION.fullmatch(accession):
        raise ValueError('Expected an OSD-NNN accession')
    number = accession.split('-')[1]
    # Query both the OSD accession and GeneLab predecessor identifier.
    # This improves recall but will also produce false positives.
    return f'"OSD-{number}"[All Fields] OR "GLDS-{number}"[All Fields]'


def search_pubmed(
    accession: str,
    retmax: int = 100,
    timeout: int = 30,
    email: str | None = None,
) -> dict[str, Any]:
    if not 1 <= retmax <= 1000:
        raise ValueError('retmax must be between 1 and 1000')
    params = urllib.parse.urlencode({
        'db': 'pubmed', 'term': make_query(accession),
        'retmode': 'json', 'retmax': retmax, 'tool': 'SpaceflightBiologyNavigator',
    })
    contact_email = email or os.environ.get('SPACEFLIGHT_BIOLOGY_NCBI_EMAIL')
    if contact_email:
        params += '&' + urllib.parse.urlencode({'email': contact_email})
    url = f'{PUBMED_ESEARCH}?{params}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'SpaceflightBiologyNavigator/0.3 (academic research metadata discovery)',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=timeout) as response:
        data: Any = json.load(response)
    if not isinstance(data, dict):
        raise ValueError('NCBI returned a JSON value with an unexpected shape')
    result = data.get('esearchresult', {})
    if not isinstance(result, dict):
        raise ValueError('NCBI response is missing a valid esearchresult object')
    identifiers = result.get('idlist', [])
    if not isinstance(identifiers, list):
        raise ValueError('NCBI response contains an invalid PubMed identifier list')
    return {
        'accession': accession.upper(), 'query': make_query(accession),
        'count_reported': int(result.get('count', 0)),
        'candidate_pmids': identifiers,
        'source_url': PUBMED_ESEARCH,
        'status': 'UNVERIFIED_CANDIDATES',
        'contact_email_configured': bool(contact_email),
        'warning': ('PubMed hits require examination of article/full-text and study '
                    'metadata before any paper–dataset association is added.'),
    }

