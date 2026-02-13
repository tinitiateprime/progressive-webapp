// src/utils/cataLayout.js

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Reading order list (Top->Bottom):
 * sort by scroll_row then topic_position
 */
export function sortTopicsReadingOrder(topics = []) {
  return [...topics].sort((a, b) => {
    const ar = toNum(a.scroll_row, 1);
    const br = toNum(b.scroll_row, 1);
    if (ar !== br) return ar - br;

    const ap = toNum(a.topic_position, 999999);
    const bp = toNum(b.topic_position, 999999);
    return ap - bp;
  });
}

/**
 * Chunk helper (used for horizontal "pages")
 * Example chunkSize=3 => [t1,t2,t3], [t4,t5,t6]...
 */
export function chunkTopics(topics = [], chunkSize = 3) {
  const out = [];
  const size = toNum(chunkSize, 3);
  for (let i = 0; i < (topics || []).length; i += size) {
    out.push(topics.slice(i, i + size));
  }
  return out;
}

/**
 * Existing logic: group by row and sort each row by position
 */
export function groupTopicsIntoRows(topics = []) {
  const map = new Map();

  for (const t of topics || []) {
    const row = toNum(t.scroll_row, 1);
    if (!map.has(row)) map.set(row, []);
    map.get(row).push(t);
  }

  const rowNumbers = Array.from(map.keys()).sort((a, b) => a - b);

  return rowNumbers.map((rowNum) => {
    const rowTopics = map.get(rowNum) || [];
    rowTopics.sort((a, b) => {
      const ap = toNum(a.topic_position, 999999);
      const bp = toNum(b.topic_position, 999999);
      return ap - bp;
    });
    return { row: rowNum, topics: rowTopics };
  });
}

/**
 * Row-major ordered list (Row1 cols 1->N, Row2 cols 1->N, ...)
 * Useful for Next/Prev buttons
 */
export function getOrderedTopics(topics = []) {
  const rows = groupTopicsIntoRows(topics);
  return rows.flatMap((r) => r.topics);
}

/**
 * Prev/Next by md_url (unique key)
 */
export function getPrevNextByMdUrl(topics = [], currentMdUrl) {
  const ordered = getOrderedTopics(topics);
  const idx = ordered.findIndex((t) => t.md_url === currentMdUrl);

  return {
    ordered,
    index: idx,
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null
  };
}
