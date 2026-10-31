"""NASA OSDR biological catalogue snapshots and transparent research-topic lenses."""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import re
import urllib.request
from typing import Any

DATASETS_URL = 'https://visualization.osdr.nasa.gov/biodata/api/v2/datasets/'
ALL_DATASET_METADATA_URL = 'https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/*/metadata/'
DATASET_URL = 'https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/{accession}/'
OSDR_STUDY_URL = 'https://osdr.nasa.gov/bio/repo/data/studies/{accession}'
ACCESSION = re.compile(r'(?<![A-Za-z0-9])OSD-\d+\b', re.IGNORECASE)

TOPICS = [
    {'id': 'animals', 'name': 'Animals & model organisms', 'description': 'Animal experiments, including model organisms and tissue-on-chip research.', 'research_prompts': ['Which animal models and flight conditions produce reproducible changes that can be compared across missions?']},
    {'id': 'computational', 'name': 'AI & computational methods', 'description': 'Computational and machine-learning approaches for spaceflight biology and health.', 'research_prompts': ['Which predictive features generalize across missions, organisms, and independent cohorts?']},
    {'id': 'archive_physiology', 'name': 'Physiology & archive data', 'description': 'Physiological, phenotypic, biomedical, imaging and behavioral data.', 'research_prompts': ['Which archived physiological, behavioral, and imaging measures can be aligned to examine longitudinal health changes?']},
    {'id': 'reproductive_health', 'name': 'Reproductive health', 'description': 'Spaceflight effects on reproductive health, organs and endocrinology.', 'research_prompts': ['Which reproductive-health endpoints are measurable across the available model systems and mission analogs?']},
    {'id': 'human_health', 'name': 'Human spaceflight health', 'description': 'Human spaceflight health and links among individual physiology, genetics and biochemistry.', 'research_prompts': ['Which individual, mission, and environmental factors explain variation in human health responses to spaceflight?']},
    {'id': 'microbial', 'name': 'Microbial systems', 'description': 'Microbial life and ecosystems relevant to spaceflight.', 'research_prompts': ['Which microbial functions and community interactions change under spaceflight or analog conditions?']},
    {'id': 'multi_omics', 'name': 'Multi-omics', 'description': 'Integration of molecular data types to study spaceflight effects.', 'research_prompts': ['Which molecular responses replicate across omics layers, tissues, and independent experiments?']},
    {'id': 'plants', 'name': 'Plant biology', 'description': 'Plant biology and crop cultivation in space.', 'research_prompts': ['Which light, gravity, water, and nutrient conditions most consistently shape plant growth and reproduction?']},
    {'id': 'radiation', 'name': 'Radiation & dosimetry', 'description': 'Radiation exposure, dosimetry and biological responses.', 'research_prompts': ['How do radiation dose, quality, and exposure timing align with biological outcomes across available experiments?']},
]

TOPIC_RULES: dict[str, tuple[str, tuple[str, ...]]] = {
    'animals': ('organism', (r'\bmouse\b', r'\bmice\b', r'mus musculus', r'\brat\b', r'rattus', r'drosophila', r'fruit fly', r'caenorhabditis', r'\bc\. elegans\b', r'\bworm\b', r'zebrafish', r'danio rerio', r'macaque', r'rhesus', r'nonhuman primate', r'\banimal\b', r'tissue.?on.?chip')),
    'computational': ('study/project/publication text', (r'machine learning', r'artificial intelligence', r'\bdeep learning\b', r'\bneural network\b', r'\bAI\b', r'\bML\b')),
    'reproductive_health': ('study/project/publication/organism text', (r'female reproduct', r'reproductive health', r'reproductive organ', r'ovari(?:an|es)', r'uter(?:us|ine)', r'endometr', r'oocyte', r'ovulation', r'fertility', r'placenta', r'pregnan', r'gamete')),
    'human_health': ('study/project/publication/organism text', (r'homo sapiens', r'\bhuman\b', r'astronaut', r'crew member')),
    'microbial': ('study/project/publication/organism text', (r'\bmicrob', r'\bbacter', r'\bvirus\b', r'\bviral\b', r'\bfung', r'\byeast\b', r'\barchaea\b', r'\bphage\b', r'microbiome', r'\bescherichia\b', r'saccharomyces')),
    'multi_omics': ('assay/study/project/publication text', (r'multi.?omics', r'transcriptom', r'proteom', r'metabolom', r'epigenom', r'genom', r'lipidom', r'single.?cell sequencing')),
    'plants': ('study/project/publication/organism text', (r'\bplant\b', r'\bplants\b', r'arabidopsis', r'oryza sativa', r'\brice\b', r'\bwheat\b', r'\blettuce\b', r'\btomato\b', r'\bpotato\b', r'\bmaize\b', r'\bcorn\b', r'\bsoybean\b', r'\bmoss\b', r'\bbrassica\b', r'\bseedling\b', r'\broot\b', r'\bleaf\b')),
    'radiation': ('study/project/publication/factor text', (r'radiation', r'dosimetr', r'ionizing', r'\bHZE\b', r'proton beam', r'heavy ion', r'particle flux', r'galactic cosmic')),
}


def extract_accessions(tree: Any) -> list[str]:
    """Find OSD accessions in a nested API document, without guessing IDs."""
    found: set[str] = set()

    def visit(obj: Any) -> None:
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key in {'accession', 'id', 'url', 'href', 'name', 'dataset'} and isinstance(value, str):
                    found.update(x.upper() for x in ACCESSION.findall(value))
                visit(value)
        elif isinstance(obj, list):
            for item in obj:
                visit(item)
        elif isinstance(obj, str) and 'OSD-' in obj.upper():
            found.update(x.upper() for x in ACCESSION.findall(obj))

    visit(tree)
    return sorted(found, key=lambda value: int(value.split('-')[1]))


def read_remote_json(url: str = DATASETS_URL, timeout: int = 90) -> Any:
    req = urllib.request.Request(url, headers={
        'User-Agent': 'SpaceflightBiologyNavigator/0.3 (open science catalogue utility)',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def _as_text(value: Any) -> str:
    if isinstance(value, list):
        return '; '.join(part for part in (_as_text(item) for item in value) if part)
    if isinstance(value, dict):
        if isinstance(value.get('name'), str):
            return value['name'].strip()
        return ''
    if value is None:
        return ''
    return re.sub(r'\s+', ' ', str(value)).strip()


def _first(value: Any) -> Any:
    return value[0] if isinstance(value, list) and value else value


def _topic_suggestions(metadata: dict[str, Any]) -> tuple[list[str], dict[str, str]]:
    topics: list[str] = []
    evidence: dict[str, str] = {}
    source_type = _as_text(metadata.get('data source type')).lower()
    if 'alsda' in source_type:
        topics.append('archive_physiology')
        evidence['archive_physiology'] = f"data source type: {_as_text(metadata.get('data source type'))}"

    sections = {
        'organism': _as_text(metadata.get('organism')),
        'study/project/publication text': ' '.join(_as_text(metadata.get(field)) for field in (
            'study title', 'project title', 'study publication title', 'study description')),
        'study/project/publication/organism text': ' '.join(_as_text(metadata.get(field)) for field in (
            'organism', 'study title', 'project title', 'study publication title', 'study description')),
        'assay/study/project/publication text': ' '.join(_as_text(metadata.get(field)) for field in (
            'study assay technology type', 'study assay technology platform', 'study title',
            'project title', 'study publication title', 'study description')),
        'study/project/publication/factor text': ' '.join(_as_text(metadata.get(field)) for field in (
            'study title', 'project title', 'study publication title', 'study factor name',
            'study factor type', 'study description')),
    }
    for topic_id, (section, patterns) in TOPIC_RULES.items():
        text = sections.get(section, '')
        matches = [pattern.replace(r'\b', '').replace('\\', '') for pattern in patterns if re.search(pattern, text, re.IGNORECASE)]
        if matches:
            topics.append(topic_id)
            evidence[topic_id] = f'{section}: ' + ', '.join(matches[:3])
    return topics, evidence


def _normalize_dataset(accession: str, entry: Any) -> dict[str, Any]:
    if not isinstance(entry, dict):
        entry = {}
    if accession in entry and isinstance(entry[accession], dict):
        entry = entry[accession]
    metadata = entry.get('metadata', {}) if isinstance(entry.get('metadata'), dict) else {}
    topics, evidence = _topic_suggestions(metadata)
    mission = metadata.get('mission', {})
    mission_name = mission.get('name', '') if isinstance(mission, dict) else mission
    authors = _as_text(metadata.get('study publication author list'))
    data_source_type = _as_text(metadata.get('data source type'))
    lower_source = data_source_type.lower()
    source_category = 'ALSDA' if 'alsda' in lower_source else ('GeneLab' if 'cgene' in lower_source else data_source_type or 'Unspecified')
    assay_type = _as_text(metadata.get('study assay technology type'))
    assay_platform = _as_text(metadata.get('study assay technology platform'))
    factors = _as_text(metadata.get('study factor name')) or _as_text(metadata.get('study factor type'))
    return {
        'accession': accession,
        'record_url': OSDR_STUDY_URL.format(accession=accession),
        'api_url': DATASET_URL.format(accession=accession),
        'title': _as_text(metadata.get('project title')) or _as_text(metadata.get('study title')) or 'Title not supplied in API metadata',
        'study_title': _as_text(metadata.get('study title')),
        'publication_title': _as_text(metadata.get('study publication title')),
        'publication_authors': authors,
        'organism': _as_text(metadata.get('organism')),
        'mission': _as_text(mission_name),
        'space_program': _as_text(metadata.get('space program')),
        'flight_program': _as_text(metadata.get('flight program')),
        'assay_type': assay_type,
        'assay_platform': assay_platform,
        'factors': factors,
        'material_type': _as_text(metadata.get('material type')),
        'source_type': data_source_type,
        'source_category': source_category,
        'project_type': _as_text(metadata.get('project type')),
        'project_url': _as_text(metadata.get('project link')),
        'description': _as_text(metadata.get('study description')),
        'release_date_unix': metadata.get('study public release date'),
        'topic_lenses': topics,
        'topic_evidence': evidence,
    }


def catalog_snapshot(raw: Any, source: str = DATASETS_URL) -> dict[str, Any]:
    """Normalize the dataset index and optional wildcard metadata response."""
    if isinstance(raw, dict) and ('dataset_index' in raw or 'dataset_metadata' in raw):
        index = raw.get('dataset_index', {})
        metadata_root = raw.get('dataset_metadata', {})
    else:
        index = raw
        metadata_root = {}

    ids = extract_accessions(index)
    if not ids and isinstance(index, dict):
        ids = sorted((key.upper() for key in index if ACCESSION.fullmatch(str(key))), key=lambda value: int(value.split('-')[1]))
    if not ids and isinstance(metadata_root, dict):
        ids = sorted((key.upper() for key in metadata_root if ACCESSION.fullmatch(str(key))), key=lambda value: int(value.split('-')[1]))

    records = []
    for accession in ids:
        entry = metadata_root.get(accession) or metadata_root.get(accession.lower()) if isinstance(metadata_root, dict) else None
        records.append(_normalize_dataset(accession, entry))

    canonical_payload = json.dumps(raw, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
    now = datetime.now(timezone.utc).isoformat()
    publication_count = sum(bool(record['publication_title']) for record in records)
    metadata_count = sum(bool(record['study_title'] or record['organism'] or record['assay_type']) for record in records)
    return {
        'schema_version': 3,
        'source_url': source,
        'metadata_source_url': ALL_DATASET_METADATA_URL if metadata_root else '',
        'retrieved_utc': now,
        'source_payload_sha256': hashlib.sha256(canonical_payload).hexdigest(),
        'total_ids_found': len(ids),
        'metadata_record_count': metadata_count,
        'publication_title_count': publication_count,
        'datasets': records,
        'topics': TOPICS,
        'topic_note': 'Research-topic lenses are overlapping metadata-based suggestions, not official classifications or scientific-review decisions. The record-level evidence field shows the terms that triggered each suggestion.',
        'coverage_note': (
            'Snapshot of the NASA OSDR Biological Data API dataset index and available aggregate metadata for GeneLab and ALSDA. '
            'The API is not every separate NASA OSDR service or data type; this is not an exhaustive publication or research-gap audit.'
        ),
    }


