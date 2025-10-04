// public/script.js
// 前端本地多格式引文生成器 - 支持 MLA, APA, Chicago, Harvard, IEEE 等

// 与后端逻辑保持一致的前端格式化功能（精简版）
const Utils = (() => {
  const collapseSpaces = (str) => String(str || "").trim().replace(/\s+/g, " ");
  const parseAuthorName = (input) => {
    const s = collapseSpaces(input);
    if (!s) return { first: "", last: "" };
    if (s.includes(",")) {
      const [last, rest] = s.split(",");
      return { last: collapseSpaces(last), first: collapseSpaces(rest) };
    } else {
      const parts = s.split(" ");
      if (parts.length === 1) return { first: parts[0], last: "" };
      const last = parts.pop();
      const first = parts.join(" ");
      return { first: collapseSpaces(first), last: collapseSpaces(last) };
    }
  };
  const formatAuthorsText = (authors = []) => {
    const parsed = authors.map(parseAuthorName).filter(a => a.first || a.last);
    if (!parsed.length) return "";
    const first = parsed[0];
    const firstFormatted = `${first.last || first.first}, ${first.first}`.replace(/,\s*$/, "").trim();
    if (parsed.length === 1) return firstFormatted;
    if (parsed.length === 2) {
      const s = parsed[1];
      const sf = `${s.first} ${s.last}`.trim();
      return `${firstFormatted}, and ${sf}`;
    }
    return `${firstFormatted}, et al.`;
  };
  const monthAbbrev = (m) => ({1:"Jan.",2:"Feb.",3:"Mar.",4:"Apr.",5:"May",6:"June",7:"July",8:"Aug.",9:"Sept.",10:"Oct.",11:"Nov.",12:"Dec."}[m]||"");
  const formatDateText = (iso) => {
    const s = collapseSpaces(iso);
    if (!s) return "n.d.";
    const parts = s.split("-").map(p => parseInt(p,10));
    const year = parts[0]; if (!year) return "n.d.";
    const month = parts[1]; const day = parts[2];
    if (month && day) return `${day} ${monthAbbrev(month)} ${year}`;
    if (month) return `${monthAbbrev(month)} ${year}`;
    return String(year);
  };
  const formatPagesText = (pages) => {
    const s = collapseSpaces(pages);
    if (!s) return "";
    if (/\d+\s*-\s*\d+/.test(s)) return `pp. ${s.replace(/\s+/g,"")}`;
    if (/\d+/.test(s)) return `p. ${s.replace(/\s+/g,"")}`;
    return s;
  };
  const chooseLink = (doiOrUrl) => {
    const s = collapseSpaces(doiOrUrl);
    if (!s) return "";
    if (/^10\./.test(s)) return `https://doi.org/${s}`;
    if (/^doi:/i.test(s)) return `https://doi.org/${s.replace(/^doi:/i, "")}`;
    return s;
  };
  const ensurePeriodEnd = (str) => {
    const s = collapseSpaces(str);
    if (!s) return "";
    return /[.!?]$/.test(s) ? s : s + ".";
  };
  const escapeHtml = (str) => String(str||"")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const buildBook = (d) => {
    const a = formatAuthorsText(d.authors);
    const t = (d.title||"").trim();
    const ed = (d.edition||"").trim();
    const tail = [d.publisher, d.year].filter(Boolean).join(", ");
    const link = chooseLink(d.doiOrUrl||"");
    const text = [a&&ensurePeriodEnd(a), t&&ensurePeriodEnd(t), ed&&ensurePeriodEnd(ed), tail&&ensurePeriodEnd(tail), link&&ensurePeriodEnd(link)].filter(Boolean).join(" ");
    const html = [a&&escapeHtml(ensurePeriodEnd(a)), t&&`<i>${escapeHtml(ensurePeriodEnd(t))}</i>`, ed&&escapeHtml(ensurePeriodEnd(ed)), tail&&escapeHtml(ensurePeriodEnd(tail)), link&&`<a href="${escapeHtml(link)}" target="_blank">${escapeHtml(ensurePeriodEnd(link))}</a>`].filter(Boolean).join(" ");
    return { citationText: text, citationHTML: html };
  };
  const buildWebsite = (d) => {
    const a = formatAuthorsText(d.authors);
    const pt = (d.pageTitle||"").trim();
    const ws = (d.websiteName||"").trim();
    const pub = (d.publisher||"").trim();
    const u = (d.url||"").trim();
    const pd = formatDateText(d.publishDate||"");
    const ad = formatDateText(d.accessDate||"");
    const text = [a&&ensurePeriodEnd(a), pt&&`"${pt}."`, ws&&`${ws}.`, pub&&`${pub}.`, (pd&&pd!=='n.d.')&&`${pd}.`, u&&ensurePeriodEnd(u), ad&&`Accessed ${ad}.`].filter(Boolean).join(" ");
    const html = [a&&escapeHtml(ensurePeriodEnd(a)), pt&&`“${escapeHtml(pt)}.”`, ws&&`<i>${escapeHtml(ws)}.</i>`, pub&&`${escapeHtml(pub)}.`, (pd&&pd!=='n.d.')&&`${escapeHtml(pd)}.`, u&&`<a href="${escapeHtml(u)}" target="_blank">${escapeHtml(ensurePeriodEnd(u))}</a>`, ad&&`Accessed ${escapeHtml(ad)}.`].filter(Boolean).join(" ");
    return { citationText: text, citationHTML: html };
  };
  const buildJournal = (d) => {
    const a = formatAuthorsText(d.authors);
    const at = (d.articleTitle||"").trim();
    const jn = (d.journalName||"").trim();
    const vol = (d.volume||"").trim();
    const iss = (d.issue||"").trim();
    const y = (d.year||"").trim();
    const pg = formatPagesText(d.pages||"");
    const link = chooseLink(d.doiOrUrl||"");
    const vi = [vol?`vol. ${vol}`:"", iss?`no. ${iss}`:""].filter(Boolean).join(", ");
    const text = [a&&ensurePeriodEnd(a), at&&`"${at}."`, jn&&`${jn},`, vi&&`${vi},`, y&&`${y},`, pg&&`${pg}.`, link&&ensurePeriodEnd(link)].filter(Boolean).join(" ");
    const html = [a&&escapeHtml(ensurePeriodEnd(a)), at&&`“${escapeHtml(at)}.”`, jn&&`<i>${escapeHtml(jn)}</i>,`, vi&&`${escapeHtml(vi)},`, y&&`${escapeHtml(y)},`, pg&&`${escapeHtml(pg)}.`, link&&`<a href="${escapeHtml(link)}" target="_blank">${escapeHtml(ensurePeriodEnd(link))}</a>`].filter(Boolean).join(" ");
    return { citationText: text, citationHTML: html };
  };
  // APA 7 格式生成器
  const buildBookAPA = (d) => {
    const a = formatAuthorsAPA(d.authors);
    const t = (d.title||"").trim();
    const ed = (d.edition||"").trim();
    const pub = (d.publisher||"").trim();
    const y = (d.year||"").trim();
    const doi = chooseLink(d.doiOrUrl||"");
    
    const text = `${a} (${y}). ${t}${ed ? ` (${ed})` : ''}. ${pub}${doi ? `. ${doi}` : ''}.`;
    const html = `${escapeHtml(a)} (${escapeHtml(y)}). <i>${escapeHtml(t)}</i>${ed ? ` (${escapeHtml(ed)})` : ''}. ${escapeHtml(pub)}${doi ? `. <a href="${escapeHtml(doi)}" target="_blank">${escapeHtml(doi)}</a>` : ''}.`;
    
    return { citationText: text, citationHTML: html };
  };

  const buildWebsiteAPA = (d) => {
    const a = formatAuthorsAPA(d.authors);
    const pt = (d.pageTitle||"").trim();
    const ws = (d.websiteName||"").trim();
    const pub = (d.publisher||"").trim();
    const u = (d.url||"").trim();
    const pd = formatDateAPA(d.publishDate||"");
    const ad = formatDateAPA(d.accessDate||"");
    
    const text = `${a} (${pd}). ${pt}. ${ws}. ${pub ? `${pub}. ` : ''}${u}${ad ? ` (Accessed ${ad})` : ''}`;
    const html = `${escapeHtml(a)} (${escapeHtml(pd)}). ${escapeHtml(pt)}. <i>${escapeHtml(ws)}</i>. ${pub ? `${escapeHtml(pub)}. ` : ''}<a href="${escapeHtml(u)}" target="_blank">${escapeHtml(u)}</a>${ad ? ` (Accessed ${escapeHtml(ad)})` : ''}`;
    
    return { citationText: text, citationHTML: html };
  };

  const buildJournalAPA = (d) => {
    const a = formatAuthorsAPA(d.authors);
    const at = (d.articleTitle||"").trim();
    const jn = (d.journalName||"").trim();
    const vol = (d.volume||"").trim();
    const iss = (d.issue||"").trim();
    const y = (d.year||"").trim();
    const pg = formatPagesText(d.pages||"");
    const doi = chooseLink(d.doiOrUrl||"");
    
    const text = `${a} (${y}). ${at}. <i>${jn}</i>, ${vol}${iss ? `(${iss})` : ''}${pg ? `, ${pg}` : ''}. ${doi || ''}`;
    const html = `${escapeHtml(a)} (${escapeHtml(y)}). ${escapeHtml(at)}. <i>${escapeHtml(jn)}</i>, ${escapeHtml(vol)}${iss ? `(${escapeHtml(iss)})` : ''}${pg ? `, ${escapeHtml(pg)}` : ''}. ${doi ? `<a href="${escapeHtml(doi)}" target="_blank">${escapeHtml(doi)}</a>` : ''}`;
    
    return { citationText: text, citationHTML: html };
  };

  // Chicago 格式生成器
  const buildBookChicago = (d) => {
    const a = formatAuthorsChicago(d.authors);
    const t = (d.title||"").trim();
    const ed = (d.edition||"").trim();
    const pub = (d.publisher||"").trim();
    const y = (d.year||"").trim();
    const doi = chooseLink(d.doiOrUrl||"");
    
    const text = `${a}. ${t}${ed ? `, ${ed}` : ''}. ${pub}, ${y}${doi ? `. ${doi}` : ''}.`;
    const html = `${escapeHtml(a)}. <i>${escapeHtml(t)}</i>${ed ? `, ${escapeHtml(ed)}` : ''}. ${escapeHtml(pub)}, ${escapeHtml(y)}${doi ? `. <a href="${escapeHtml(doi)}" target="_blank">${escapeHtml(doi)}</a>` : ''}.`;
    
    return { citationText: text, citationHTML: html };
  };

  // Harvard 格式生成器
  const buildBookHarvard = (d) => {
    const a = formatAuthorsHarvard(d.authors);
    const t = (d.title||"").trim();
    const ed = (d.edition||"").trim();
    const pub = (d.publisher||"").trim();
    const y = (d.year||"").trim();
    const doi = chooseLink(d.doiOrUrl||"");
    
    const text = `${a} ${y}, ${t}${ed ? `, ${ed}` : ''}, ${pub}${doi ? `, ${doi}` : ''}.`;
    const html = `${escapeHtml(a)} ${escapeHtml(y)}, <i>${escapeHtml(t)}</i>${ed ? `, ${escapeHtml(ed)}` : ''}, ${escapeHtml(pub)}${doi ? `, <a href="${escapeHtml(doi)}" target="_blank">${escapeHtml(doi)}</a>` : ''}.`;
    
    return { citationText: text, citationHTML: html };
  };

  // IEEE 格式生成器
  const buildBookIEEE = (d) => {
    const a = formatAuthorsIEEE(d.authors);
    const t = (d.title||"").trim();
    const pub = (d.publisher||"").trim();
    const y = (d.year||"").trim();
    const doi = chooseLink(d.doiOrUrl||"");
    
    const text = `${a}, "${t}," ${pub}, ${y}${doi ? `, ${doi}` : ''}.`;
    const html = `${escapeHtml(a)}, "${escapeHtml(t)}," ${escapeHtml(pub)}, ${escapeHtml(y)}${doi ? `, <a href="${escapeHtml(doi)}" target="_blank">${escapeHtml(doi)}</a>` : ''}.`;
    
    return { citationText: text, citationHTML: html };
  };

  // 辅助函数
  const formatAuthorsAPA = (authors = []) => {
    const parsed = authors.map(parseAuthorName).filter(a => a.first || a.last);
    if (!parsed.length) return "";
    if (parsed.length === 1) {
      const a = parsed[0];
      return `${a.last}, ${a.first.charAt(0).toUpperCase()}.`;
    }
    if (parsed.length === 2) {
      const a1 = parsed[0], a2 = parsed[1];
      return `${a1.last}, ${a1.first.charAt(0).toUpperCase()}., & ${a2.first.charAt(0).toUpperCase()}. ${a2.last}`;
    }
    const first = parsed[0];
    return `${first.last}, ${first.first.charAt(0).toUpperCase()}., et al.`;
  };

  const formatAuthorsChicago = (authors = []) => {
    const parsed = authors.map(parseAuthorName).filter(a => a.first || a.last);
    if (!parsed.length) return "";
    if (parsed.length === 1) {
      const a = parsed[0];
      return `${a.first} ${a.last}`;
    }
    if (parsed.length === 2) {
      const a1 = parsed[0], a2 = parsed[1];
      return `${a1.first} ${a1.last} and ${a2.first} ${a2.last}`;
    }
    const first = parsed[0];
    return `${first.first} ${first.last} et al.`;
  };

  const formatAuthorsHarvard = (authors = []) => {
    const parsed = authors.map(parseAuthorName).filter(a => a.first || a.last);
    if (!parsed.length) return "";
    if (parsed.length === 1) {
      const a = parsed[0];
      return `${a.last}, ${a.first.charAt(0).toUpperCase()}.`;
    }
    if (parsed.length === 2) {
      const a1 = parsed[0], a2 = parsed[1];
      return `${a1.last}, ${a1.first.charAt(0).toUpperCase()}. and ${a2.first.charAt(0).toUpperCase()}. ${a2.last}`;
    }
    const first = parsed[0];
    return `${first.last}, ${first.first.charAt(0).toUpperCase()}. et al.`;
  };

  const formatAuthorsIEEE = (authors = []) => {
    const parsed = authors.map(parseAuthorName).filter(a => a.first || a.last);
    if (!parsed.length) return "";
    return parsed.map(a => `${a.first.charAt(0).toUpperCase()}. ${a.last}`).join(', ');
  };

  const formatDateAPA = (iso) => {
    const s = collapseSpaces(iso);
    if (!s) return "n.d.";
    const parts = s.split("-").map(p => parseInt(p,10));
    const year = parts[0];
    if (!year) return "n.d.";
    const month = parts[1];
    const day = parts[2];
    if (month && day) return `${monthAbbrev(month)} ${day}, ${year}`;
    if (month) return `${monthAbbrev(month)} ${year}`;
    return String(year);
  };

  const generateCitation = (format, type, data) => {
    if (format === 'mla9') {
      if (type==='book') return buildBook(data);
      if (type==='website') return buildWebsite(data);
      if (type==='journal') return buildJournal(data);
    } else if (format === 'apa7') {
      if (type==='book') return buildBookAPA(data);
      if (type==='website') return buildWebsiteAPA(data);
      if (type==='journal') return buildJournalAPA(data);
    } else if (format === 'chicago') {
      if (type==='book') return buildBookChicago(data);
      if (type==='website') return buildWebsite(data); // 简化处理
      if (type==='journal') return buildJournal(data); // 简化处理
    } else if (format === 'harvard') {
      if (type==='book') return buildBookHarvard(data);
      if (type==='website') return buildWebsite(data); // 简化处理
      if (type==='journal') return buildJournal(data); // 简化处理
    } else if (format === 'ieee') {
      if (type==='book') return buildBookIEEE(data);
      if (type==='website') return buildWebsite(data); // 简化处理
      if (type==='journal') return buildJournal(data); // 简化处理
    }
    return { citationText: '', citationHTML: '' };
  };

  return { 
    collapseSpaces, parseAuthorName, formatAuthorsText, monthAbbrev, formatDateText, formatPagesText, 
    chooseLink, ensurePeriodEnd, escapeHtml, buildBook, buildWebsite, buildJournal, 
    buildBookAPA, buildWebsiteAPA, buildJournalAPA, buildBookChicago, buildBookHarvard, buildBookIEEE,
    generateCitation 
  };
})();

// 界面逻辑
const el = (sel) => document.querySelector(sel);
const elAll = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  format: 'mla9',
  type: 'book',
  authors: [ '' ],
};


function renderAuthors() {
  const container = el('#authorsList');
  container.innerHTML = '';
  state.authors.forEach((value, idx) => {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-[1fr_auto] gap-2';
    row.innerHTML = `
      <input class="field" placeholder="e.g., Doe, Jane or Jane Doe" value="${Utils.escapeHtml(value)}" data-idx="${idx}">
      <button class="px-3 py-2 bg-red-100 text-red-700 rounded" data-remove="${idx}">Remove</button>
    `;
    container.appendChild(row);
  });
}

function renderFields() {
  const c = el('#fieldsContainer');
  const t = state.type;
  const commonClass = 'field';
  if (t === 'book') {
    c.innerHTML = `
      <div class="field-row">
        <div>
          <label class="label">Title</label>
          <input id="title" class="${commonClass}" placeholder="e.g., The Great Gatsby">
        </div>
        <div>
          <label class="label">Edition (optional)</label>
          <input id="edition" class="${commonClass}" placeholder="e.g., 2nd ed.">
        </div>
      </div>
      <div class="field-row">
        <div>
          <label class="label">Publisher</label>
          <input id="publisher" class="${commonClass}" placeholder="e.g., Scribner">
        </div>
        <div>
          <label class="label">Year</label>
          <input id="year" class="${commonClass}" placeholder="e.g., 1995">
        </div>
      </div>
      <div>
        <label class="label">DOI/URL (optional)</label>
        <input id="doiOrUrl" class="${commonClass}" placeholder="e.g., 10.1234/abcd or https://...">
      </div>
    `;
  } else if (t === 'website') {
    c.innerHTML = `
      <div class="field-row">
        <div>
          <label class="label">Page Title</label>
          <input id="pageTitle" class="${commonClass}" placeholder="e.g., Understanding Climate Change">
        </div>
        <div>
          <label class="label">Website Name</label>
          <input id="websiteName" class="${commonClass}" placeholder="e.g., NASA">
        </div>
      </div>
      <div class="field-row">
        <div>
          <label class="label">Publication Date (optional)</label>
          <input id="publishDate" type="date">
        </div>
        <div>
          <label class="label">Access Date</label>
          <input id="accessDate" type="date">
        </div>
      </div>
      <div class="field-row">
        <div>
          <label class="label">Publisher (optional)</label>
          <input id="publisher" class="${commonClass}" placeholder="e.g., NASA Earth Observatory">
        </div>
        <div>
          <label class="label">URL</label>
          <input id="url" class="${commonClass}" placeholder="https://...">
        </div>
      </div>
    `;
  } else {
    c.innerHTML = `
      <div class="field-row">
        <div>
          <label class="label">Article Title</label>
          <input id="articleTitle" class="${commonClass}" placeholder="e.g., Quantum Entanglement Basics">
        </div>
        <div>
          <label class="label">Journal Name</label>
          <input id="journalName" class="${commonClass}" placeholder="e.g., Nature Physics">
        </div>
      </div>
      <div class="field-row">
        <div>
          <label class="label">Volume (optional)</label>
          <input id="volume" class="${commonClass}" placeholder="e.g., 12">
        </div>
        <div>
          <label class="label">Issue (optional)</label>
          <input id="issue" class="${commonClass}" placeholder="e.g., 3">
        </div>
      </div>
      <div class="field-row">
        <div>
          <label class="label">Year</label>
          <input id="year" class="${commonClass}" placeholder="e.g., 2021">
        </div>
        <div>
          <label class="label">Pages (optional)</label>
          <input id="pages" class="${commonClass}" placeholder="e.g., 123-145 or 7">
        </div>
      </div>
      <div>
        <label class="label">DOI/URL (optional)</label>
        <input id="doiOrUrl" class="${commonClass}" placeholder="e.g., 10.5678/xyz or https://...">
      </div>
    `;
  }
}

function collectData() {
  const format = state.format;
  const type = state.type;
  const authors = state.authors.map(Utils.collapseSpaces).filter(Boolean);
  if (type === 'book') {
    return {
      format,
      type,
      data: {
        authors,
        title: el('#title')?.value || '',
        edition: el('#edition')?.value || '',
        publisher: el('#publisher')?.value || '',
        year: el('#year')?.value || '',
        doiOrUrl: el('#doiOrUrl')?.value || ''
      }
    };
  } else if (type === 'website') {
    return {
      format,
      type,
      data: {
        authors,
        pageTitle: el('#pageTitle')?.value || '',
        websiteName: el('#websiteName')?.value || '',
        publisher: el('#publisher')?.value || '',
        url: el('#url')?.value || '',
        publishDate: el('#publishDate')?.value || '',
        accessDate: el('#accessDate')?.value || ''
      }
    };
  } else {
    return {
      format,
      type,
      data: {
        authors,
        articleTitle: el('#articleTitle')?.value || '',
        journalName: el('#journalName')?.value || '',
        volume: el('#volume')?.value || '',
        issue: el('#issue')?.value || '',
        year: el('#year')?.value || '',
        pages: el('#pages')?.value || '',
        doiOrUrl: el('#doiOrUrl')?.value || ''
      }
    };
  }
}

function renderPreview(result) {
  el('#previewText').textContent = result.citationText || '';
  el('#previewHTML').innerHTML = result.citationHTML || '';
}

function localGenerate() {
  const { format, type, data } = collectData();
  const result = Utils.generateCitation(format, type, data);
  renderPreview(result);
}


function bindEvents() {
  el('#citationFormat').addEventListener('change', (e) => { state.format = e.target.value; localGenerate(); });
  el('#sourceType').addEventListener('change', (e) => { state.type = e.target.value; renderFields(); localGenerate(); });
  el('#addAuthor').addEventListener('click', () => { state.authors.push(''); renderAuthors(); localGenerate(); });

  el('#authorsList').addEventListener('input', (e) => {
    const idx = e.target.getAttribute('data-idx');
    if (idx !== null) { state.authors[Number(idx)] = e.target.value; localGenerate(); }
  });
  el('#authorsList').addEventListener('click', (e) => {
    const r = e.target.getAttribute('data-remove');
    if (r !== null) { state.authors.splice(Number(r),1); renderAuthors(); localGenerate(); }
  });

  document.body.addEventListener('input', (e) => {
    const id = e.target.id;
    if (['title','edition','publisher','year','doiOrUrl','pageTitle','websiteName','url','publishDate','accessDate','articleTitle','journalName','volume','issue','pages'].includes(id)) {
      localGenerate();
    }
  });

  el('#copyText').addEventListener('click', async () => {
    const text = el('#previewText').textContent || '';
    try { await navigator.clipboard.writeText(text); alert('Copied to clipboard'); } catch { alert('Copy failed'); }
  });
  el('#downloadText').addEventListener('click', () => {
    const text = el('#previewText').textContent || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'citation.txt'; a.click(); URL.revokeObjectURL(url);
  });
  el('#downloadHTML').addEventListener('click', () => {
    const html = el('#previewHTML').innerHTML || '';
    const blob = new Blob([`<div>${html}</div>`], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'citation.html'; a.click(); URL.revokeObjectURL(url);
  });
}

function init() {
  renderAuthors();
  renderFields();
  bindEvents();
  localGenerate();
}

init();
