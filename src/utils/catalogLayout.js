/**
 * Groups topics into rows by scroll_row and sorts each row by topic_position.
 * Robust handling:
 * - missing scroll_row => row 1
 * - missing topic_position => goes to end
 */
export function groupTopicsIntoRows(topics = []) {
  const map = new Map();

  for (const t of topics) {
    const row = Number.isFinite(Number(t.scroll_row)) ? Number(t.scroll_row) : 1;
    if (!map.has(row)) map.set(row, []);
    map.get(row).push(t);
  }

  const rowNumbers = Array.from(map.keys()).sort((a, b) => a - b);

  return rowNumbers.map((rowNum) => {
    const rowTopics = map.get(rowNum) || [];
    rowTopics.sort((a, b) => {
      const ap = Number.isFinite(Number(a.topic_position)) ? Number(a.topic_position) : 999999;
      const bp = Number.isFinite(Number(b.topic_position)) ? Number(b.topic_position) : 999999;
      return ap - bp;
    });
    return { row: rowNum, topics: rowTopics };
  });
}
