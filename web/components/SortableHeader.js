"use client";

export default function SortableHeader({ label, sortKey, currentSort, onSort, align = "left", className = "" }) {
  const isActive = currentSort.key === sortKey;
  const arrow = isActive ? (currentSort.direction === "asc" ? "▲" : "▼") : "";

  return (
    <th
      className={`py-3 pr-4 font-medium cursor-pointer select-none hover:text-paper/80 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className={isActive ? "text-brass-400" : ""}>
        {label} {arrow}
      </span>
    </th>
  );
}

/**
 * Generic sort helper — pass the rows array and the current {key, direction}
 * state, get back a sorted copy. `getValue(row, key)` extracts the
 * comparable value for a given sort key from a row (lets each table define
 * its own field mapping without this helper needing to know row shape).
 */
export function sortRows(rows, sort, getValue) {
  if (!sort.key) return rows;
  // Nulls are separated out and always appended at the end, regardless of
  // sort direction — sorting-then-reversing-for-desc was undoing the
  // "nulls last" placement on descending sorts (caught via testing), so
  // nulls are handled as a fully separate step instead of relying on
  // comparator return values plus a blanket reverse.
  const withValue = [];
  const withoutValue = [];
  for (const row of rows) {
    (getValue(row, sort.key) == null ? withoutValue : withValue).push(row);
  }
  withValue.sort((a, b) => {
    const va = getValue(a, sort.key);
    const vb = getValue(b, sort.key);
    const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
    return sort.direction === "asc" ? cmp : -cmp;
  });
  return [...withValue, ...withoutValue];
}

/** Toggles sort direction on repeat clicks of the same column, defaults
 * new columns to descending for numbers (highest first is usually more
 * useful) and ascending for the first click overall. */
export function nextSortState(current, key, isString) {
  if (current.key !== key) return { key, direction: isString ? "asc" : "desc" };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}
