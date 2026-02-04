export function normalizeFilterArrayValue(value) {
  const raw = Array.isArray(value) ? value.join("\n") : String(value || "");
  const list = raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(list));
}

export function normalizeFilterSingleValue(value) {
  return String(value || "").trim();
}

export function normalizeFilterValueByOp(op, value) {
  if (op === "in") {
    return normalizeFilterArrayValue(value);
  }
  return normalizeFilterSingleValue(value);
}
