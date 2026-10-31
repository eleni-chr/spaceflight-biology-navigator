'use strict';
const data = window.SPACEBIO_CATALOG || {};
const records = Array.isArray(data.datasets) ? data.datasets : [];
const topics = Array.isArray(data.topics) ? data.topics : [];
const svgNS = 'http://www.w3.org/2000/svg';
const width = 1100, height = 820, centerX = width / 2, centerY = 410, orbit = 270;
const palette = ['#198b7d','#4289bf','#d48d32','#966ac5','#2e9b9d','#5282b6','#d26d55','#6f9b58','#6d7dc0'];
const glyphs = ['✿','⌘','◈','◎','✦','◌','▦','♧','✧'];
const byTopic = new Map();
const metrics = document.querySelector('#heroMetrics');
const svg = document.querySelector('#atlasMap');
const transformGroup = document.querySelector('#networkTransform');
const edgeLayer = document.querySelector('#topicEdges');
const connectionLayer = document.querySelector('#topicConnections');
const recordLayer = document.querySelector('#recordNodes');
const topicLayer = document.querySelector('#topicNodes');
const searchInput = document.querySelector('#mapSearch');
const topicSelect = document.querySelector('#topicSelect');
const status = document.querySelector('#mapStatus');
const panelTitle = document.querySelector('#detailTitle');
const panelCount = document.querySelector('#detailCount');
const panelBody = document.querySelector('#detailBody');
let activeTopic = '';
let compareTopic = '';
let selectedRecord = '';
let query = '';
let view = {x:0,y:0,s:1};
let drag = null;

function svgEl(tag, attrs, parent) {
  const node = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, String(value));
  if (parent) parent.append(node);
  return node;
}
function svgText(parent, value, attrs) {
  const node = svgEl('text', attrs, parent);
  node.textContent = value;
  return node;
}
function stableHash(value) {
  let hash = 2166136261;
  for (const ch of String(value)) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
function safeURL(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
}
function addMetric(value, label) {
  const item = document.createElement('div'); item.className = 'metric';
  const strong = document.createElement('strong'); strong.textContent = Number(value || 0).toLocaleString();
  const small = document.createElement('span'); small.textContent = label;
  item.append(strong, small); metrics.append(item);
}
for (let i = 0; i < topics.length; i += 1) {
  const topic = topics[i];
  const angle = -Math.PI / 2 + i * Math.PI * 2 / Math.max(1, topics.length);
  topic.color = palette[i % palette.length]; topic.glyph = glyphs[i % glyphs.length];
  topic.x = centerX + Math.cos(angle) * orbit; topic.y = centerY + Math.sin(angle) * orbit;
  topic.angle = angle; topic.count = 0; byTopic.set(topic.id, topic);
  const option = document.createElement('option'); option.value = topic.id; option.textContent = topic.name; topicSelect.append(option);
}
const memberships = new Map();
const pairCounts = new Map();
const signatures = new Map();
const recordById = new Map(records.map(record => [record.accession,record]));
for (const record of records) {
  const ids = Array.isArray(record.topic_lenses) ? record.topic_lenses.filter(id => byTopic.has(id)) : [];
  memberships.set(record.accession, ids);
  ids.forEach(id => { byTopic.get(id).count += 1; });
  for (let i = 0; i < ids.length; i += 1) for (let j = i + 1; j < ids.length; j += 1) {
    const pair = [ids[i], ids[j]].sort().join('|'); pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
  }
  const signature = ids.slice().sort().join('|') || 'unmatched';
  if (!signatures.has(signature)) signatures.set(signature, []);
  signatures.get(signature).push(record);
}
const topicPoint = new Map(topics.map(topic => [topic.id, {x:topic.x,y:topic.y}]));
const pointForRecord = new Map();
for (const [signature, group] of signatures) {
  const ids = signature === 'unmatched' ? [] : signature.split('|');
  const base = ids.length ? ids.reduce((acc, id) => ({x:acc.x + byTopic.get(id).x / ids.length, y:acc.y + byTopic.get(id).y / ids.length}), {x:0,y:0}) : {x:982,y:755};
  group.sort((a,b) => a.accession.localeCompare(b.accession, undefined, {numeric:true}));
  group.forEach((record, index) => {
    const hash = stableHash(record.accession);
    const angle = index * 2.399963229728653 + (hash % 1000) / 1000 * .31;
    const radius = 14 + Math.sqrt((index + .6) / Math.max(1, group.length)) * (ids.length ? 86 : 23);
    pointForRecord.set(record.accession, {x:base.x + Math.cos(angle) * radius, y:base.y + Math.sin(angle) * radius});
  });
}
const pubCount = records.filter(record => String(record.publication_title || '').trim()).length;
addMetric(records.length, 'dataset records'); addMetric(topics.length, 'research topics'); addMetric(pubCount, 'records with a title');
const retrievedDate = data.retrieved_utc ? new Date(data.retrieved_utc).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}) : 'date unavailable';
document.querySelector('#snapshotNote').textContent = 'Bundled snapshot retrieved ' + retrievedDate + ' · ' + records.length.toLocaleString() + ' accessions · ' + (data.metadata_record_count || 0).toLocaleString() + ' records with metadata. Live source records may have changed.';

function edgePath(a,b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx,dy));
  const bend = Math.min(27, len * .035);
  const cx = (a.x+b.x)/2 - (dy/len)*bend;
  const cy = (a.y+b.y)/2 + (dx/len)*bend;
  return 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
}
for (const [pair, count] of pairCounts) {
  const [aId,bId] = pair.split('|'), a = byTopic.get(aId), b = byTopic.get(bId);
  const midX = (a.x+b.x)/2, midY = (a.y+b.y)/2;
  const ctrlX = centerX + (midX-centerX)*.62, ctrlY = centerY + (midY-centerY)*.62;
  const path = svgEl('path',{class:'topicConnection',d:'M'+a.x+' '+a.y+' Q'+ctrlX+' '+ctrlY+' '+b.x+' '+b.y,'data-pair':pair,'stroke-width':Math.min(7,1+Math.sqrt(count)/5)},connectionLayer);
  path.dataset.count = String(count); path.dataset.a = aId; path.dataset.b = bId;
}
for (const record of records) {
  const ids = memberships.get(record.accession) || [];
  const point = pointForRecord.get(record.accession);
  for (const id of ids) svgEl('path',{class:'topicEdge','data-record':record.accession,'data-topic':id,d:edgePath(point,topicPoint.get(id)),stroke:byTopic.get(id).color},edgeLayer);
  const primary = ids.length ? byTopic.get(ids[0]) : null;
  const group = svgEl('g',{class:'recordNode','data-record':record.accession},recordLayer);
  const dot = svgEl('circle',{class:'recordDot',cx:point.x,cy:point.y,r:ids.length > 1 ? 5.2 : 4.4,fill:primary ? primary.color : '#8997a5'},group);
  const title = svgEl('title',{},group); title.textContent = record.accession + ' · ' + (record.title || 'OSDR dataset record');
  group.addEventListener('click',event => { event.stopPropagation(); selectedRecord = record.accession; renderPanel(); renderFocus(); focusPoint(point.x,point.y,1.7); });
  group.dataset.topics = ids.join('|'); dot.dataset.role = 'mark';
}
for (const topic of topics) {
  const group = svgEl('g',{class:'topicNode',role:'button',tabindex:'0','aria-label':topic.name + ', ' + topic.count.toLocaleString() + ' metadata matches','data-topic':topic.id},topicLayer);
  svgEl('circle',{class:'topicBubble',cx:topic.x,cy:topic.y,r:48,stroke:topic.color},group);
  svgText(group,topic.glyph,{class:'topicGlyph',x:topic.x,y:topic.y-8,fill:topic.color});
  svgText(group,topic.count.toLocaleString(),{class:'topicCountSvg',x:topic.x,y:topic.y+22});
  const labelRadius = 81, lx = topic.x + Math.cos(topic.angle)*labelRadius, ly = topic.y + Math.sin(topic.angle)*labelRadius;
  const label = svgText(group,topic.name,{class:'topicNameSvg',x:lx,y:ly,'text-anchor':'middle'});
  const mid = topic.name.length > 23 ? Math.ceil(topic.name.length/2) : 0;
  if (mid) {
    const words = topic.name.split(' '); let first = '', second = '';
    for (const word of words) { if ((first+' '+word).trim().length <= mid || !first) first=(first+' '+word).trim(); else second=(second+' '+word).trim(); }
    label.textContent='';
    const t1=svgEl('tspan',{x:lx,dy:'0'},label);t1.textContent=first;
    const t2=svgEl('tspan',{x:lx,dy:'14'},label);t2.textContent=second;
  }
  group.addEventListener('click',event => { event.stopPropagation(); setTopic(topic.id); });
  group.addEventListener('keydown',event => { if (event.key==='Enter'||event.key===' ') { event.preventDefault(); setTopic(topic.id); } });
}
if (records.some(record => !(memberships.get(record.accession) || []).length)) {
  const unmatched = records.filter(record => !(memberships.get(record.accession) || []).length).length;
  svgText(topicLayer,unmatched.toLocaleString()+' records without a topic match',{class:'topicNameSvg',x:982,y:790,'text-anchor':'middle'});
}

function recordMatches(record) {
  if (!query) return true;
  const fields = [record.accession,record.title,record.study_title,record.publication_title,record.publication_authors,record.organism,record.mission,record.assay_type,record.assay_platform,record.factors,record.description,record.project_type].concat(Object.values(record.topic_evidence || {}));
  return fields.filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
}
function visibleRecords() {
  return records.filter(record => {
    const ids = memberships.get(record.accession) || [];
    if (activeTopic && !ids.includes(activeTopic)) return false;
    if (compareTopic && !ids.includes(compareTopic)) return false;
    return recordMatches(record);
  });
}
function renderFocus() {
  const visible = new Set(visibleRecords().map(record => record.accession));
  for (const node of recordLayer.querySelectorAll('.recordNode')) {
    const included = visible.has(node.dataset.record);
    node.classList.toggle('dimmed',!included);
    node.classList.toggle('highlighted',included && Boolean(activeTopic || query || compareTopic));
    node.classList.toggle('selected',node.dataset.record === selectedRecord);
  }
  for (const edge of edgeLayer.querySelectorAll('.topicEdge')) {
    const selected = !activeTopic || edge.dataset.topic === activeTopic;
    const comparison = compareTopic && edge.dataset.topic === compareTopic;
    edge.style.opacity = (selected && !compareTopic) ? (query ? '.42' : '.13') : ((comparison || (compareTopic && edge.dataset.topic === activeTopic)) ? '.42' : '.025');
    if (!visible.has(edge.dataset.record)) edge.style.opacity = '.015';
  }
  for (const link of connectionLayer.querySelectorAll('.topicConnection')) {
    const isPair = compareTopic && [activeTopic,compareTopic].sort().join('|') === link.dataset.pair;
    const isRelated = activeTopic && [link.dataset.a,link.dataset.b].includes(activeTopic);
    link.style.opacity = isPair ? '.82' : (isRelated ? '.35' : (activeTopic ? '.045' : '.13'));
    link.style.strokeDasharray = isPair ? '7 5' : 'none';
  }
  for (const node of topicLayer.querySelectorAll('.topicNode')) {
    const isActive = node.dataset.topic === activeTopic;
    node.style.opacity = activeTopic && !isActive && node.dataset.topic !== compareTopic ? '.54' : '1';
  }
  const selectedPair = compareTopic ? [activeTopic,compareTopic].sort().join('|') : '';
  for (const label of connectionLayer.querySelectorAll('.connectionLabel')) label.remove();
  if (selectedPair) {
    const path = connectionLayer.querySelector('[data-pair="'+selectedPair+'"]');
    if (path) {
      const parts=path.getAttribute('d').match(/[-\d.]+/g).map(Number);
      const x=(parts[0]+2*parts[2]+parts[4])/4, y=(parts[1]+2*parts[3]+parts[5])/4;
      svgText(connectionLayer,pairCounts.get(selectedPair).toLocaleString(),{class:'connectionLabel',x,y});
    }
  }
  const count = visible.size;
  status.textContent = count.toLocaleString() + ' of ' + records.length.toLocaleString() + ' records shown' + (compareTopic ? ' · shared topic match' : (activeTopic ? ' · ' + byTopic.get(activeTopic).name : '')) + (query ? ' · search: “'+query+'”' : '');
}
function setTopic(id) {
  activeTopic = id; compareTopic = ''; selectedRecord = '';
  topicSelect.value = id; renderPanel(); renderFocus();
  if (id) focusPoint(byTopic.get(id).x,byTopic.get(id).y,1.26);
}
function el(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}
function sourceLink(href,label) {
  const url=safeURL(href); if(!url) return null;
  const a=el('a','detailSource',label); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; return a;
}
function resultButton(record) {
  const button=el('button','resultChoice'); button.type='button';
  const accession=el('strong','',record.accession || 'OSDR record');
  const title=el('span','',record.title || record.study_title || 'Untitled record');
  const detail=el('small','',[record.organism,record.mission,record.assay_type].filter(Boolean).join(' · '));
  button.append(accession,title,detail);
  button.addEventListener('click',()=>{ selectedRecord=record.accession; renderPanel(); renderFocus(); const point=pointForRecord.get(record.accession); if(point) focusPoint(point.x,point.y,1.7); });
  return button;
}
function getTitleLeads(rows) {
  const output=[]; const seen=new Set();
  for (const row of rows) {
    const title=String(row.publication_title || '').trim(), key=title.toLocaleLowerCase();
    if(!title || seen.has(key)) continue;
    seen.add(key); output.push({title,record:row});
    if(output.length===4) break;
  }
  return output;
}
function addRecordList(parent, rows, limit) {
  const list=el('div','resultList');
  for(const record of rows.slice(0,limit)) list.append(resultButton(record));
  if(rows.length===0) list.append(el('div','noResults','No records match these filters.'));
  parent.append(list);
  if(rows.length>limit) parent.append(el('p','snapshotLine','Showing '+limit.toLocaleString()+' of '+rows.length.toLocaleString()+'. Open the explorer for the complete filtered record list.'));
}
function addTopicIndex(parent) {
  const heading=el('h3','', 'Choose a research topic'); parent.append(heading);
  const list=el('div','topicIndex');
  for(const topic of topics) {
    const button=el('button','topicChoice'); button.type='button';
    const swatch=el('span','topicSwatch'); swatch.style.background=topic.color;
    const name=el('span','',topic.name); const count=el('small','',topic.count.toLocaleString()+' records');
    button.append(swatch,name,count); button.addEventListener('click',()=>setTopic(topic.id)); list.append(button);
  }
  parent.append(list);
}
function renderTopicPanel(topic) {
  const rows=records.filter(record=>(memberships.get(record.accession)||[]).includes(topic.id));
  panelTitle.textContent=topic.name;
  panelCount.textContent=(compareTopic ? visibleRecords().length.toLocaleString()+' shared metadata matches' : rows.length.toLocaleString()+' metadata matches');
  panelBody.replaceChildren();
  panelBody.append(el('p','',topic.description || ''));
  panelBody.append(el('div','noticeBox','A topic match reflects terms or source labels in available OSDR metadata. It is a discovery aid, not a reviewed scientific classification.'));
  const prompts=topic.research_prompts || [];
  if(prompts.length) {
    panelBody.append(el('h3','', 'Candidate literature-review direction'));
    for(const prompt of prompts) panelBody.append(el('div','promptBox',prompt));
  }
  const others=topics.map(other=>({topic:other,count:pairCounts.get([topic.id,other.id].sort().join('|'))||0})).filter(item=>item.topic.id!==topic.id && item.count).sort((a,b)=>b.count-a.count);
  if(others.length) {
    panelBody.append(el('h3','', 'Overlapping metadata topics'));
    const list=el('div','overlapList');
    for(const item of others.slice(0,5)) {
      const button=el('button','overlapLink'); button.type='button';
      button.append(el('span','',item.topic.name),el('strong','',item.count.toLocaleString()+' shared'));
      button.addEventListener('click',()=>{ compareTopic=item.topic.id; selectedRecord=''; renderPanel(); renderFocus(); }); list.append(button);
    }
    panelBody.append(list);
  }
  if(compareTopic) {
    const other=byTopic.get(compareTopic);
    panelBody.append(el('div','noticeBox','Showing records whose metadata matches both “'+topic.name+'” and “'+other.name+'”. This overlap is a keyword/source match only.'));
    const clear=el('button','controlButton','Clear topic comparison'); clear.type='button'; clear.addEventListener('click',()=>{compareTopic='';renderPanel();renderFocus();}); panelBody.append(clear);
  }
  const effective=visibleRecords();
  const leads=getTitleLeads(effective);
  panelBody.append(el('h3','', 'Publication titles listed in matched records'));
  if(leads.length) {
    for(const lead of leads) {
      const item=el('div','resultChoice');
      item.append(el('span','',lead.title),el('small','',lead.record.accession+' · title from OSDR metadata'));
      const link=sourceLink(lead.record.record_url,'Open linked OSDR record'); if(link)item.append(link);
      panelBody.append(item);
    }
  } else panelBody.append(el('p','snapshotLine','No publication title is listed in the currently matched records.'));
  panelBody.append(el('h3','',compareTopic?'Shared records':'Sample matched records'));
  addRecordList(panelBody,effective,10);
  const browse=el('a','detailSource','Browse all '+rows.length.toLocaleString()+' matched records');
  browse.href='explorer.html?topic='+encodeURIComponent(topic.id); panelBody.append(browse);
}

function renderSearchPanel(rows) {
  panelTitle.textContent='Search results'; panelCount.textContent=rows.length.toLocaleString()+' matches'; panelBody.replaceChildren();
  panelBody.append(el('p','', 'Search checks accession, study and publication titles, authors, organism, mission, assay, factors, and description fields in the bundled snapshot.'));
  addRecordList(panelBody,rows,14);
}
function renderRecordPanel(record) {
  const ids=memberships.get(record.accession)||[];
  panelTitle.textContent=record.accession;
  panelCount.textContent=ids.length?ids.length+' topic matches':'No topic match';
  panelBody.replaceChildren();
  panelBody.append(el('div','panelEyebrow','OSDR dataset record'));
  panelBody.append(el('p','',record.title || record.study_title || 'Untitled record'));
  if(record.publication_title) {
    panelBody.append(el('h3','', 'Publication title in OSDR metadata'));
    panelBody.append(el('p','',record.publication_title));
    if(record.publication_authors) panelBody.append(el('p','snapshotLine',record.publication_authors));
  }
  const fields=[['Study title',record.study_title],['Organism',record.organism],['Mission',record.mission],['Assay',record.assay_type],['Factors',record.factors],['Source collection',record.source_category]];
  for(const [label,value] of fields) if(value) {panelBody.append(el('h3','',label));panelBody.append(el('p','',value));}
  if(ids.length) {
    panelBody.append(el('h3','', 'Metadata topic matches'));
    for(const id of ids) {
      const topic=byTopic.get(id), evidence=(record.topic_evidence||{})[id];
      const button=el('button','overlapLink');button.type='button';button.append(el('span','',topic.name),el('strong','',evidence||'metadata match'));
      button.addEventListener('click',()=>setTopic(id));panelBody.append(button);
    }
  }
  const link=sourceLink(record.record_url,'Open NASA OSDR record'); if(link)panelBody.append(link);
  panelBody.append(el('div','noticeBox','The metadata link does not establish that the listed publication used every sample, assay, or measurement in this record. Follow the source and paper to verify the relationship.'));
}
function renderDefaultPanel() {
  const filtered=visibleRecords(); panelTitle.textContent='All topics'; panelCount.textContent=records.length.toLocaleString()+' records'; panelBody.replaceChildren();
  panelBody.append(el('p','', 'This network brings the bundled OSDR dataset records into one view. Topic nodes are linked to records whenever the snapshot metadata triggers a topic rule.'));
  panelBody.append(el('div','noticeBox','A shared record links multiple topics. The map shows metadata overlap; it does not assess publication quality, prove a research gap, or determine whether a dataset can answer a question.'));
  if(query) {panelBody.append(el('h3','', 'Search matches'));addRecordList(panelBody,filtered,14);}
  addTopicIndex(panelBody);
  const unmatched=records.filter(record=>!(memberships.get(record.accession)||[]).length);
  if(unmatched.length) {
    panelBody.append(el('h3','', 'Unmatched records'));
    panelBody.append(el('p','snapshotLine',unmatched.length.toLocaleString()+' records in this snapshot did not match any of the nine metadata topic rules.'));
    addRecordList(panelBody,unmatched,Math.min(8,unmatched.length));
  }
}
function renderPanel() {
  if(selectedRecord) {const record=recordById.get(selectedRecord);if(record){renderRecordPanel(record);return;}}
  if(activeTopic) {renderTopicPanel(byTopic.get(activeTopic));return;}
  if(query) {renderSearchPanel(visibleRecords());return;}
  renderDefaultPanel();
}
function focusPoint(x,y,scale) {
  const next=Math.max(.75,Math.min(2.4,scale));
  view.s=next;view.x=centerX-x*next;view.y=centerY-y*next;applyView();
}
function applyView() { transformGroup.setAttribute('transform','translate('+view.x+' '+view.y+') scale('+view.s+')'); }
function svgPoint(clientX,clientY) {
  const point=svg.createSVGPoint();point.x=clientX;point.y=clientY;return point.matrixTransform(svg.getScreenCTM().inverse());
}
function zoomAt(point,factor) {
  const next=Math.max(.7,Math.min(2.4,view.s*factor));
  view.x=point.x-(point.x-view.x)*(next/view.s);view.y=point.y-(point.y-view.y)*(next/view.s);view.s=next;applyView();
}
svg.addEventListener('wheel',event=>{event.preventDefault();zoomAt(svgPoint(event.clientX,event.clientY),event.deltaY<0?1.12:.89);},{passive:false});
svg.addEventListener('pointerdown',event=>{
  if(event.target.closest('.topicNode,.recordNode')) return;
  drag={x:event.clientX,y:event.clientY,viewX:view.x,viewY:view.y};svg.setPointerCapture(event.pointerId);svg.classList.add('dragging');
});
svg.addEventListener('pointermove',event=>{
  if(!drag)return;const rect=svg.getBoundingClientRect();view.x=drag.viewX+(event.clientX-drag.x)*width/rect.width;view.y=drag.viewY+(event.clientY-drag.y)*height/rect.height;applyView();
});
function endDrag(){drag=null;svg.classList.remove('dragging');}
svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
document.querySelector('#zoomIn').addEventListener('click',()=>zoomAt({x:centerX,y:centerY},1.2));
document.querySelector('#zoomOut').addEventListener('click',()=>zoomAt({x:centerX,y:centerY},.84));
document.querySelector('#zoomReset').addEventListener('click',()=>{view={x:0,y:0,s:1};applyView();});
topicSelect.addEventListener('change',()=>setTopic(topicSelect.value));
searchInput.addEventListener('input',()=>{query=searchInput.value.trim().toLocaleLowerCase();selectedRecord='';renderPanel();renderFocus();});
document.querySelector('#clearButton').addEventListener('click',()=>{searchInput.value='';query='';activeTopic='';compareTopic='';selectedRecord='';topicSelect.value='';renderPanel();renderFocus();view={x:0,y:0,s:1};applyView();});
renderPanel();renderFocus();
