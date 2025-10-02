// src/citation.js
// MLA 9 生成器核心逻辑（文本与HTML两种输出）

function collapseSpaces(str) {
  return String(str || "").trim().replace(/\s+/g, " ");
}

function parseAuthorName(input) {
  // 输入如 "First Middle Last" 或 "Last, First Middle"
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
}

function formatAuthorsText(authors = []) {
  const parsed = authors.map(parseAuthorName).filter(a => a.first || a.last);
  if (parsed.length === 0) return "";
  const first = parsed[0];
  const firstFormatted = `${first.last || first.first}, ${first.first}`.replace(/,\s*$/, "").trim();
  if (parsed.length === 1) return firstFormatted;
  if (parsed.length === 2) {
    const second = parsed[1];
    const secondFormatted = `${second.first} ${second.last}`.trim();
    return `${firstFormatted}, and ${secondFormatted}`;
  }
  // 3+ authors
  return `${firstFormatted}, et al.`;
}

function monthAbbrev(m) {
  const map = {
    1: "Jan.", 2: "Feb.", 3: "Mar.", 4: "Apr.", 5: "May",
    6: "June", 7: "July", 8: "Aug.", 9: "Sept.", 10: "Oct.", 11: "Nov.", 12: "Dec."
  };
  return map[m] || "";
}

function formatDateText(iso) {
  // 支持 YYYY 或 YYYY-MM 或 YYYY-MM-DD
  const s = collapseSpaces(iso);
  if (!s) return "n.d.";
  const parts = s.split("-").map(p => parseInt(p, 10));
  const year = parts[0];
  if (!year) return "n.d.";
  const month = parts[1];
  const day = parts[2];
  if (month && day) return `${day} ${monthAbbrev(month)} ${year}`;
  if (month) return `${monthAbbrev(month)} ${year}`;
  return String(year);
}

function formatPagesText(pages) {
  const s = collapseSpaces(pages);
  if (!s) return "";
  if (/\d+\s*-\s*\d+/.test(s)) return `pp. ${s.replace(/\s+/g, "")}`;
  if (/\d+/.test(s)) return `p. ${s.replace(/\s+/g, "")}`;
  return s;
}

function chooseLink(doiOrUrl) {
  const s = collapseSpaces(doiOrUrl);
  if (!s) return "";
  if (/^10\./.test(s)) return `https://doi.org/${s}`;
  if (/^doi:/i.test(s)) return `https://doi.org/${s.replace(/^doi:/i, "")}`;
  return s;
}

function ensurePeriodEnd(str) {
  const s = collapseSpaces(str);
  if (!s) return "";
  return /[.!?]$/.test(s) ? s : s + ".";
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBook({ authors = [], title = "", edition = "", publisher = "", year = "", doiOrUrl = "" }) {
  const a = formatAuthorsText(authors);
  const t = collapseSpaces(title);
  const ed = collapseSpaces(edition);
  const pub = collapseSpaces(publisher);
  const y = collapseSpaces(year);
  const link = chooseLink(doiOrUrl);
  const textParts = [];
  if (a) textParts.push(ensurePeriodEnd(a));
  if (t) textParts.push(ensurePeriodEnd(t));
  if (ed) textParts.push(ensurePeriodEnd(ed));
  const tail = [pub, y].filter(Boolean).join(", ");
  if (tail) textParts.push(ensurePeriodEnd(tail));
  if (link) textParts.push(ensurePeriodEnd(link));
  const citationText = textParts.join(" ");

  const htmlParts = [];
  if (a) htmlParts.push(`${escapeHtml(ensurePeriodEnd(a))}`);
  if (t) htmlParts.push(`<i>${escapeHtml(ensurePeriodEnd(t))}</i>`);
  if (ed) htmlParts.push(`${escapeHtml(ensurePeriodEnd(ed))}`);
  if (tail) htmlParts.push(`${escapeHtml(ensurePeriodEnd(tail))}`);
  if (link) htmlParts.push(`<a href="${escapeHtml(link)}" target="_blank">${escapeHtml(ensurePeriodEnd(link))}</a>`);
  const citationHTML = htmlParts.join(" ");

  return { citationText, citationHTML };
}

function buildWebsite({ authors = [], pageTitle = "", websiteName = "", publisher = "", url = "", publishDate = "", accessDate = "" }) {
  const a = formatAuthorsText(authors);
  const pt = collapseSpaces(pageTitle);
  const ws = collapseSpaces(websiteName);
  const pub = collapseSpaces(publisher);
  const u = collapseSpaces(url);
  const pd = formatDateText(publishDate);
  const ad = formatDateText(accessDate);

  const textParts = [];
  if (a) textParts.push(ensurePeriodEnd(a));
  if (pt) textParts.push(`"${pt}."`);
  if (ws) textParts.push(`${ws}.`);
  if (pub) textParts.push(`${pub}.`);
  if (pd && pd !== "n.d.") textParts.push(`${pd}.`);
  if (u) textParts.push(ensurePeriodEnd(u));
  if (ad) textParts.push(`Accessed ${ad}.`);
  const citationText = collapseSpaces(textParts.join(" "));

  const htmlParts = [];
  if (a) htmlParts.push(`${escapeHtml(ensurePeriodEnd(a))}`);
  if (pt) htmlParts.push(`&ldquo;${escapeHtml(pt)}.&rdquo;`);
  if (ws) htmlParts.push(`<i>${escapeHtml(ws)}.</i>`);
  if (pub) htmlParts.push(`${escapeHtml(pub)}.`);
  if (pd && pd !== "n.d.") htmlParts.push(`${escapeHtml(pd)}.`);
  if (u) htmlParts.push(`<a href="${escapeHtml(u)}" target="_blank">${escapeHtml(ensurePeriodEnd(u))}</a>`);
  if (ad) htmlParts.push(`Accessed ${escapeHtml(ad)}.`);
  const citationHTML = htmlParts.join(" ");

  return { citationText, citationHTML };
}

function buildJournal({ authors = [], articleTitle = "", journalName = "", volume = "", issue = "", year = "", pages = "", doiOrUrl = "" }) {
  const a = formatAuthorsText(authors);
  const at = collapseSpaces(articleTitle);
  const jn = collapseSpaces(journalName);
  const vol = collapseSpaces(volume);
  const iss = collapseSpaces(issue);
  const y = collapseSpaces(year);
  const pg = formatPagesText(pages);
  const link = chooseLink(doiOrUrl);

  const textParts = [];
  if (a) textParts.push(ensurePeriodEnd(a));
  if (at) textParts.push(`"${at}."`);
  if (jn) textParts.push(`${jn},`);
  const vi = [vol ? `vol. ${vol}` : "", iss ? `no. ${iss}` : ""].filter(Boolean).join(", ");
  if (vi) textParts.push(`${vi},`);
  if (y) textParts.push(`${y},`);
  if (pg) textParts.push(`${pg}.`);
  if (link) textParts.push(ensurePeriodEnd(link));
  const citationText = collapseSpaces(textParts.join(" "));

  const htmlParts = [];
  if (a) htmlParts.push(`${escapeHtml(ensurePeriodEnd(a))}`);
  if (at) htmlParts.push(`&ldquo;${escapeHtml(at)}.&rdquo;`);
  if (jn) htmlParts.push(`<i>${escapeHtml(jn)}</i>,`);
  if (vi) htmlParts.push(`${escapeHtml(vi)},`);
  if (y) htmlParts.push(`${escapeHtml(y)},`);
  if (pg) htmlParts.push(`${escapeHtml(pg)}.`);
  if (link) htmlParts.push(`<a href="${escapeHtml(link)}" target="_blank">${escapeHtml(ensurePeriodEnd(link))}</a>`);
  const citationHTML = htmlParts.join(" ");

  return { citationText, citationHTML };
}

function validatePayload(type, data) {
  const errors = [];
  function req(field) { errors.push(`${field} 为必填项`); }

  if (type === 'book') {
    if (!data.title) req('title');
    if (!data.publisher) req('publisher');
    if (!data.year) req('year');
  } else if (type === 'website') {
    if (!data.pageTitle) req('pageTitle');
    if (!data.websiteName) req('websiteName');
    if (!data.url) req('url');
    if (!data.accessDate) req('accessDate');
  } else if (type === 'journal') {
    if (!data.articleTitle) req('articleTitle');
    if (!data.journalName) req('journalName');
    if (!data.year) req('year');
  } else {
    errors.push('不支持的来源类型');
  }
  return errors;
}

function generateCitation(type, data) {
  if (type === 'book') return buildBook(data);
  if (type === 'website') return buildWebsite(data);
  if (type === 'journal') return buildJournal(data);
  throw new Error('Unsupported type');
}

module.exports = {
  collapseSpaces,
  parseAuthorName,
  formatAuthorsText,
  monthAbbrev,
  formatDateText,
  formatPagesText,
  chooseLink,
  ensurePeriodEnd,
  escapeHtml,
  buildBook,
  buildWebsite,
  buildJournal,
  validatePayload,
  generateCitation
};
