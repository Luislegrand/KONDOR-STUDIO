const metricCatalogService = require('./metricCatalog.service');
const { Parser } = require('expr-eval');

const FORMULA_TOKEN_RE = /\{([^}]+)\}/g;

const formulaParser = new Parser({
  operators: {
    in: false,
  },
});

formulaParser.functions = {
  ...formulaParser.functions,
  if: (condition, truthy, falsy) => (condition ? truthy : falsy),
  round: (value, precision = 0) => {
    const factor = Math.pow(10, precision);
    return Math.round(Number(value) * factor) / factor;
  },
  clamp: (value, min = 0, max = 1) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.min(max, Math.max(min, num));
  },
};

function normalizeMetricKeyForFormula(value) {
  if (!value) return '';
  const sanitized = String(value).trim().replace(/[^a-zA-Z0-9_]/g, '_');
  if (!sanitized) return '';
  return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `m_${sanitized}`;
}

function extractFormulaDependencies(formula) {
  if (!formula) return [];
  const deps = new Set();
  let match = null;
  while ((match = FORMULA_TOKEN_RE.exec(String(formula))) !== null) {
    const key = String(match[1] || '').trim();
    if (key) deps.add(key);
  }
  return Array.from(deps);
}

function buildFormulaSpec(definition, availableKeys) {
  const rawFormula = String(definition.formula || '').trim();
  if (!rawFormula) {
    return { error: 'formula_missing', metricKey: definition.metricKey };
  }

  const normalizedMap = new Map();
  (availableKeys || []).forEach((key) => {
    const normalized = normalizeMetricKeyForFormula(key);
    if (!normalized) return;
    normalizedMap.set(normalized, key);
  });

  let parsedFormula = rawFormula;
  parsedFormula = parsedFormula.replace(FORMULA_TOKEN_RE, (_, key) => {
    const normalized = normalizeMetricKeyForFormula(key);
    if (normalized) {
      normalizedMap.set(normalized, key);
      return normalized;
    }
    return '';
  });

  let expression = null;
  try {
    expression = formulaParser.parse(parsedFormula);
  } catch (err) {
    return {
      error: 'formula_invalid',
      details: err?.message || String(err),
      metricKey: definition.metricKey,
    };
  }

  return {
    metricKey: definition.metricKey,
    label: definition.label || definition.metricKey,
    format: definition.format || null,
    expression,
    variables: expression.variables(),
    normalizedMap,
  };
}

function buildScope(values, normalizedMap) {
  const scope = {};
  if (values && typeof values === 'object') {
    Object.entries(values).forEach(([key, raw]) => {
      const normalized = normalizeMetricKeyForFormula(key);
      if (!normalized) return;
      const value = Number(raw);
      scope[normalized] = Number.isFinite(value) ? value : 0;
      if (normalizedMap && normalizedMap.has(normalized)) return;
    });
  }
  if (normalizedMap) {
    normalizedMap.forEach((original, normalized) => {
      if (scope[normalized] === undefined && values && values[original] !== undefined) {
        const value = Number(values[original]);
        scope[normalized] = Number.isFinite(value) ? value : 0;
      }
    });
  }
  return scope;
}

function safeEvaluateFormula(spec, scope) {
  try {
    const baseScope = { ...(scope || {}) };
    if (Array.isArray(spec.variables)) {
      spec.variables.forEach((variable) => {
        if (baseScope[variable] === undefined) baseScope[variable] = 0;
      });
    }
    const value = spec.expression.evaluate(baseScope);
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return numeric;
  } catch (err) {
    return null;
  }
}

function applyCalculatedTotals(defs, dataTotals) {
  const totals = { ...(dataTotals || {}) };
  const pending = new Map(defs.map((def) => [def.metricKey, def]));
  let progressed = true;

  while (pending.size && progressed) {
    progressed = false;
    for (const [metricKey, def] of pending.entries()) {
      const scope = buildScope(totals, def.normalizedMap);
      const value = safeEvaluateFormula(def, scope);
      if (value === null) continue;
      totals[metricKey] = value;
      pending.delete(metricKey);
      progressed = true;
    }
  }

  return { totals, unresolved: Array.from(pending.keys()) };
}

function applyCalculatedSeries(defs, baseSeries = [], totals = {}) {
  const seriesMap = new Map();
  baseSeries.forEach((serie) => {
    const key = serie.metric || serie.name;
    if (!key) return;
    seriesMap.set(key, serie.data || []);
  });

  const nextSeries = [...baseSeries];

  defs.forEach((def) => {
    const metricKey = def.metricKey;
    if (seriesMap.has(metricKey)) return;
    const base = baseSeries.find((serie) => Array.isArray(serie.data) && serie.data.length);
    const points = base ? base.data : [];
    if (!points.length) return;

    const computed = points.map((point) => {
      const rowValues = {};
      seriesMap.forEach((dataPoints, key) => {
        const match = dataPoints.find((item) => item.x === point.x);
        if (match && match.y !== undefined) {
          rowValues[key] = match.y;
        }
      });
      const scope = buildScope({ ...totals, ...rowValues }, def.normalizedMap);
      const value = safeEvaluateFormula(def, scope);
      return {
        x: point.x,
        y: value === null ? 0 : value,
      };
    });

    nextSeries.push({ metric: metricKey, data: computed });
  });

  return nextSeries;
}

function applyCalculatedTable(defs, table = [], totals = {}) {
  if (!Array.isArray(table) || !table.length) return table;
  return table.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const nextRow = { ...row };
    defs.forEach((def) => {
      if (Object.prototype.hasOwnProperty.call(nextRow, def.metricKey)) return;
      const scope = buildScope({ ...totals, ...nextRow }, def.normalizedMap);
      const value = safeEvaluateFormula(def, scope);
      if (value !== null) {
        nextRow[def.metricKey] = value;
      }
    });
    return nextRow;
  });
}

async function prepareCalculatedMetrics(tenantId, querySpec, requestedMetrics) {
  if (!requestedMetrics || !requestedMetrics.length) {
    return {
      calculatedDefs: [],
      calculatedKeys: new Set(),
      dependencyKeys: new Set(),
      baseMetrics: requestedMetrics || [],
    };
  }

  const calculatedDefs = await metricCatalogService.listCalculatedMetrics(tenantId, {
    source: querySpec.source,
    level: querySpec.level,
    metricKeys: requestedMetrics,
  });

  const calculatedKeys = new Set(calculatedDefs.map((item) => item.metricKey));
  const dependencyKeys = new Set();
  calculatedDefs.forEach((item) => {
    extractFormulaDependencies(item.formula).forEach((dep) => dependencyKeys.add(dep));
  });

  const baseMetrics = Array.from(
    new Set([
      ...requestedMetrics.filter((metric) => !calculatedKeys.has(metric)),
      ...Array.from(dependencyKeys).filter((metric) => !calculatedKeys.has(metric)),
    ]),
  );

  return {
    calculatedDefs,
    calculatedKeys,
    dependencyKeys,
    baseMetrics,
  };
}

function applyCalculatedMetricsToData(querySpec, data, requestedMetrics, calculatedDefs) {
  if (!requestedMetrics || !requestedMetrics.length) return { data, calculated: [] };
  if (!Array.isArray(calculatedDefs) || !calculatedDefs.length) {
    return { data, calculated: [] };
  }

  const availableKeys = new Set([
    ...Object.keys(data?.totals || {}),
    ...(Array.isArray(data?.series)
      ? data.series.map((serie) => serie.metric || serie.name).filter(Boolean)
      : []),
    ...(Array.isArray(data?.table) && data.table.length
      ? Object.keys(data.table[0] || {})
      : []),
  ]);

  const specs = calculatedDefs.map((def) => ({
    ...def,
    ...buildFormulaSpec(def, Array.from(availableKeys)),
  }));

  const validSpecs = specs.filter((spec) => !spec.error);

  const totalsResult = applyCalculatedTotals(validSpecs, data?.totals || {});
  const nextSeries = applyCalculatedSeries(validSpecs, data?.series || [], totalsResult.totals);
  const nextTable = applyCalculatedTable(validSpecs, data?.table || [], totalsResult.totals);

  const meta = {
    ...(data?.meta || {}),
    calculated: {
      metrics: validSpecs.map((spec) => spec.metricKey),
      unresolved: totalsResult.unresolved,
      errors: specs
        .filter((spec) => spec.error)
        .map((spec) => ({
          metricKey: spec.metricKey,
          error: spec.error,
          details: spec.details || null,
        })),
    },
  };

  return {
    data: {
      ...(data || {}),
      totals: totalsResult.totals,
      series: nextSeries,
      table: nextTable,
      meta,
    },
    calculated: validSpecs,
  };
}

module.exports = {
  prepareCalculatedMetrics,
  applyCalculatedMetricsToData,
};
