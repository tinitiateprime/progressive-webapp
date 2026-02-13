// File: src/utils/catalogLayout.js

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function norm(s) {
  return String(s || "").toLowerCase().trim();
}

function isReadme(topic) {
  return norm(topic?.topic_name) === "readme";
}

/**
 * Computes safe row/col for every topic:
 * - If scroll_row/topic_position exist → use them
 * - Else fallback to list order using cols
 */
function withComputedRowCol(topics = [], cols = 3) {
  const c = Math.max(1, Number(cols) || 3);

  return (topics || []).map((t, i) => {
    const fallbackRow = Math.floor(i / c) + 1;
    const fallbackCol = (i % c) + 1;

    return {
      ...t,
      __row: toNum(t?.scroll_row, fallbackRow),
      __col: toNum(t?.topic_position, fallbackCol),
      __idx: i,
    };
  });
}

/**
 * ✅ Row-wise sort:
 * README first, then row (top→bottom), then col (left→right)
 */
export function sortTopicsRowWise(topics = [], cols = 3) {
  const arr = withComputedRowCol(topics, cols);

  arr.sort((a, b) => {
    const ar = isReadme(a);
    const br = isReadme(b);
    if (ar !== br) return ar ? -1 : 1;

    if (a.__row !== b.__row) return a.__row - b.__row;
    if (a.__col !== b.__col) return a.__col - b.__col;

    // stable fallback
    return (a.__idx ?? 0) - (b.__idx ?? 0);
  });

  // remove computed fields before returning
  return arr.map(({ __row, __col, __idx, ...rest }) => rest);
}

/**
 * ✅ Groups into rows using computed row/col (never column-fill scramble)
 * Returns: [{ row: 1, topics: [...] }, { row: 2, topics: [...] }, ...]
 */
export function groupTopicsIntoRows(topics = [], cols = 3) {
  const c = Math.max(1, Number(cols) || 3);
  const arr = withComputedRowCol(topics, c);

  // group by row
  const rowMap = new Map();
  for (const t of arr) {
    const r = t.__row;
    if (!rowMap.has(r)) rowMap.set(r, []);
    rowMap.get(r).push(t);
  }

  const rows = [...rowMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, rowTopics]) => {
      const ordered = [...rowTopics].sort((a, b) => {
        const ar = isReadme(a);
        const br = isReadme(b);
        if (ar !== br) return ar ? -1 : 1;

        if (a.__col !== b.__col) return a.__col - b.__col;
        return (a.__idx ?? 0) - (b.__idx ?? 0);
      });

      return {
        row,
        topics: ordered.map(({ __row, __col, __idx, ...rest }) => rest),
      };
    });

  return rows;
}
