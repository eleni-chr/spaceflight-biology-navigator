'use strict';

const catalog = window.SPACEBIO_CATALOG || {};
const rows = document.querySelector('#catalogRows');
const search = document.querySelector('#catalogSearch');
const topicFilter = document.querySelector('#topicFilter');
const sourceFilter = document.querySelector('#sourceFilter');
const status = document.querySelector('#catalogStatus');
const message = document.querySelector('#catalogMessage');
const empty = document.querySelector('#catalogEmpty');
const source = document.querySelector('#catalogSource');
const topicCards = document.querySelector('#topicCards');
const heroStats = document.querySelector('#heroStats');
const topicNote = document.querySelector('#topicNote');
const hasCurrentSnapshot = Boolean(catalog.retrieved_utc && Array.isArray(catalog.datasets) && catalog.datasets.length);
const fallbackRecords = Array.isArray(window.SPACEBIO_SEED?.datasets) ? window.SPACEBIO_SEED.datasets.map(dataset => ({
  accession: dataset.id,
  title: dataset.id,
  record_url: dataset.url,
  api_url: `https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/${dataset.id}/`,
  topic_lenses: [],
  topic_evidence: {}
})) : [];
const records = hasCurrentSnapshot ? catalog.datasets : fallbackRecords;
const topics = Array.isArray(catalog.topics) ? catalog.topics : [];
const topicById = new Map(topics.map(topic => [topic.id, topic]));

function safeLink(value, label) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const anchor = document.createElement('a');
    anchor.href = url.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = label;
    return anchor;
  } catch {
    return null;
  }
}

function appendLine(parent, label, value) {
  if (!value) return;
  const line = document.createElement('div');
  line.className = 'metadataLine';
  line.textContent = label ? `${label}: ${value}` : value;
  parent.append(line);
}

function appendStat(label, value) {
  const item = document.createElement('span');
  item.className = 'heroStat';
  item.textContent = `${value} ${label}`;
  heroStats.append(item);
}

function buildFilters() {
  for (const topic of topics) {
    const option = document.createElement('option');
    option.value = topic.id;
    option.textContent = topic.name;
    topicFilter.append(option);
  }
  const sources = [...new Set(records.map(record => record.source_category).filter(Boolean))].sort();
  for (const sourceName of sources) {
    const option = document.createElement('option');
    option.value = sourceName;
    option.textContent = sourceName;
    sourceFilter.append(option);
  }
}

function renderTopicCards() {
  topicCards.replaceChildren();
  for (const topic of topics) {
    const count = records.filter(record => Array.isArray(record.topic_lenses) && record.topic_lenses.includes(topic.id)).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'topicCard';
    button.dataset.topic = topic.id;
    const name = document.createElement('div');
    name.className = 'topicName';
    name.textContent = topic.name;
    const matches = document.createElement('div');
    matches.className = 'topicCount';
    matches.textContent = `${count} metadata-topic matches`;
    const description = document.createElement('div');
    description.className = 'topicDescription';
    description.textContent = topic.description;
    button.append(name, matches, description);
    button.addEventListener('click', () => {
      topicFilter.value = topic.id;
      renderCatalog();
      document.querySelector('#catalogHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    topicCards.append(button);
  }
}

function renderHeroStats() {
  heroStats.replaceChildren();
  appendStat('dataset records', catalog.total_ids_found || records.length);
  appendStat('metadata records', catalog.metadata_record_count || 0);
  appendStat('records with publication titles', catalog.publication_title_count || 0);
  appendStat('research-topic lenses', topics.length);
  if (catalog.retrieved_utc) appendStat('snapshot (UTC)', catalog.retrieved_utc);
}

function formatRelease(unixTime) {
  if (unixTime === null || unixTime === undefined || unixTime === '') return '';
  if (!Number.isFinite(Number(unixTime))) return '';
  return new Date(Number(unixTime) * 1000).toISOString().slice(0, 10);
}

function makeRow(record) {
  const row = document.createElement('tr');
  const accessionCell = document.createElement('th');
  accessionCell.scope = 'row';
  accessionCell.textContent = record.accession || 'Unknown accession';
  const nasaLink = safeLink(record.record_url, 'NASA OSDR record ↗');
  if (nasaLink) {
    nasaLink.className = 'smallLink';
    accessionCell.append(document.createElement('br'), nasaLink);
  }
  row.append(accessionCell);

  const studyCell = document.createElement('td');
  const title = document.createElement('div');
  title.className = 'recordTitle';
  title.textContent = record.title || record.study_title || 'Title not supplied in API metadata';
  studyCell.append(title);
  if (record.study_title && record.study_title !== record.title) appendLine(studyCell, 'Study', record.study_title);
  if (record.publication_title) {
    const publication = document.createElement('div');
    publication.className = 'pubTitle';
    publication.textContent = record.publication_title;
    studyCell.append(publication);
    if (record.publication_authors) appendLine(studyCell, 'Authors listed by OSDR', record.publication_authors);
    const pubmed = safeLink(`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(record.publication_title)}`, 'Search PubMed for title ↗');
    if (pubmed) {
      pubmed.className = 'smallLink';
      studyCell.append(pubmed);
    }
  }
  if (record.description) {
    const details = document.createElement('details');
    details.className = 'recordDetails';
    const summary = document.createElement('summary');
    summary.textContent = 'OSDR study description';
    const description = document.createElement('div');
    description.className = 'recordDescription';
    description.textContent = record.description;
    details.append(summary, description);
    studyCell.append(details);
  }
  row.append(studyCell);

  const metadataCell = document.createElement('td');
  appendLine(metadataCell, 'Organism', record.organism);
  appendLine(metadataCell, 'Mission', record.mission);
  appendLine(metadataCell, 'Assay', [record.assay_type, record.assay_platform].filter(Boolean).join(' · '));
  appendLine(metadataCell, 'Factors', record.factors);
  appendLine(metadataCell, 'Collection', record.source_category || record.source_type);
  const releaseDate = formatRelease(record.release_date_unix);
  if (releaseDate) appendLine(metadataCell, 'Released', releaseDate);
  const projectLink = safeLink(record.project_url, 'Related project page ↗');
  if (projectLink) {
    projectLink.className = 'smallLink';
    metadataCell.append(projectLink);
  }
  row.append(metadataCell);

  const topicCell = document.createElement('td');
  const topicList = document.createElement('div');
  topicList.className = 'topicList';
  for (const topicId of record.topic_lenses || []) {
    const topic = topicById.get(topicId);
    if (!topic) continue;
    const badge = document.createElement('span');
    badge.className = 'topicBadge';
    badge.textContent = topic.name;
    badge.title = record.topic_evidence?.[topicId] || 'Metadata-topic match';
    topicList.append(badge);
  }
  if (topicList.childElementCount) topicCell.append(topicList);
  else {
    const noTopic = document.createElement('span');
    noTopic.className = 'noTopic';
    noTopic.textContent = 'No clear topic signal in these metadata fields; this does not exclude relevance.';
    topicCell.append(noTopic);
  }
  row.append(topicCell);
  return row;
}

function filteredRecords() {
  const query = search.value.trim().toLowerCase();
  const selectedTopic = topicFilter.value;
  const selectedSource = sourceFilter.value;
  return records.filter(record => {
    if (selectedTopic !== 'all' && !(record.topic_lenses || []).includes(selectedTopic)) return false;
    if (selectedSource !== 'all' && record.source_category !== selectedSource) return false;
    if (!query) return true;
    const text = [
      record.accession, record.title, record.study_title, record.publication_title,
      record.publication_authors, record.organism, record.mission, record.space_program,
      record.flight_program, record.assay_type, record.assay_platform, record.factors,
      record.material_type, record.source_category, record.source_type, record.description,
      ...(record.topic_lenses || []).map(id => topicById.get(id)?.name || id)
    ].join(' ').toLowerCase();
    return text.includes(query);
  });
}

function renderCatalog() {
  const visible = filteredRecords();
  rows.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const record of visible) fragment.append(makeRow(record));
  rows.append(fragment);
  empty.hidden = visible.length > 0;
  status.textContent = `${visible.length.toLocaleString()} of ${records.length.toLocaleString()} records` +
    (catalog.retrieved_utc ? ` · snapshot retrieved ${catalog.retrieved_utc}` : ' · curated seed fallback');
  for (const card of topicCards.querySelectorAll('.topicCard')) {
    card.setAttribute('aria-pressed', String(topicFilter.value === card.dataset.topic));
  }
}

function csvCell(value) {
  const text = String(value ?? '');
  const firstNonWhitespace = text.trimStart()[0];
  const spreadsheetSafe = ['=', '+', '-', '@'].includes(firstNonWhitespace) ? `'${text}` : text;
  return `"${spreadsheetSafe.replaceAll('"', '""')}"`;
}
function downloadCsv() {
  const headers = ['accession', 'study_title', 'publication_title', 'publication_authors', 'organism', 'mission', 'assay_type', 'assay_platform', 'factors', 'source_category', 'topic_lenses_suggested', 'record_url'];
  const lines = [headers.map(csvCell).join(',')];
  for (const record of filteredRecords()) {
    const values = [record.accession, record.title || record.study_title, record.publication_title,
      record.publication_authors, record.organism, record.mission, record.assay_type,
      record.assay_platform, record.factors, record.source_category,
      (record.topic_lenses || []).map(id => topicById.get(id)?.name || id).join('; '), record.record_url];
    lines.push(values.map(csvCell).join(','));
  }
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `spaceflight-biology-navigator-filtered-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function renderSource() {
  source.replaceChildren();
  const apiLink = safeLink(catalog.source_url, 'Biological Data API dataset listing');
  const metadataLink = safeLink(catalog.metadata_source_url, 'aggregate metadata endpoint');
  if (apiLink) source.append(apiLink);
  if (metadataLink) source.append(document.createTextNode(' · '), metadataLink);
  if (catalog.source_payload_sha256) {
    source.append(document.createTextNode(' · Source payload SHA-256: '));
    const hash = document.createElement('code');
    hash.textContent = catalog.source_payload_sha256;
    source.append(hash);
  }
}

if (!hasCurrentSnapshot) {
  message.hidden = false;
  message.textContent = 'No full catalog snapshot is bundled. Run the catalog refresh command in the repository README to download the current Biological Data API index and metadata.';
  topicNote.textContent = 'Research-topic lenses will appear after a full catalog snapshot is generated.';
} else {
  message.hidden = false;
  message.textContent = catalog.coverage_note || '';
  topicNote.textContent = catalog.topic_note || 'Research-topic lenses are discovery suggestions based on metadata.';
}

buildFilters();
const requestedTopic = new URLSearchParams(window.location.search).get('topic');
if (topicById.has(requestedTopic)) topicFilter.value = requestedTopic;
renderTopicCards();
renderHeroStats();
renderSource();
search.addEventListener('input', renderCatalog);
topicFilter.addEventListener('change', renderCatalog);
sourceFilter.addEventListener('change', renderCatalog);
document.querySelector('#catalogClear').addEventListener('click', () => {
  search.value = '';
  topicFilter.value = 'all';
  sourceFilter.value = 'all';
  renderCatalog();
  search.focus();
});
document.querySelector('#catalogDownload').addEventListener('click', downloadCsv);
renderCatalog();






