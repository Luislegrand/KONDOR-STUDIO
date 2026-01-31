const { prisma } = require("../../prisma");
const uploadsService = require("../../services/uploadsService");
const reportingData = require("./reportingData.service");
const cache = require("./reportingCache.service");
const reportingSnapshots = require("./reportingSnapshots.service");
const reportingCalculated = require("./reportingCalculated.service");
const { hasBrandScope, isBrandAllowed } = require("./reportingScope.service");

function escapeHtml(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function slugify(value) {
  return String(value || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveBrandForGroup(tenantId, groupId) {
  if (!tenantId || !groupId) return null;
  const member = await prisma.brandGroupMember.findFirst({
    where: { tenantId, groupId },
    select: { brandId: true },
    orderBy: { createdAt: "asc" },
  });
  return member?.brandId || null;
}

async function resolveBrandForReport(tenantId, report) {
  let brandId = report?.brandId || report?.params?.brandId || null;
  if (!brandId && report?.groupId) {
    brandId = await resolveBrandForGroup(tenantId, report.groupId);
  }
  return brandId || null;
}

async function buildConnectionMapForBrand(tenantId, brandId) {
  if (!tenantId || !brandId) return new Map();
  const connections = await prisma.dataSourceConnection.findMany({
    where: { tenantId, brandId, status: "CONNECTED" },
    orderBy: { createdAt: "desc" },
  });
  const map = new Map();
  connections.forEach((connection) => {
    if (!connection?.source) return;
    if (!map.has(connection.source)) {
      map.set(connection.source, connection.id);
    }
  });
  return map;
}

async function ensureSnapshotsForReport(tenantId, report, scope) {
  const snapshotList = await reportingSnapshots.listReportSnapshots(
    tenantId,
    report.id,
    scope
  );
  const snapshotItems = snapshotList?.items || [];
  const snapshotByWidget = new Map();
  snapshotItems.forEach((item) => {
    if (item?.widgetId) snapshotByWidget.set(item.widgetId, item);
  });

  const brandId = await resolveBrandForReport(tenantId, report);
  const connectionMap = await buildConnectionMapForBrand(tenantId, brandId);
  const widgets = Array.isArray(report.widgets) ? report.widgets : [];

  for (const widget of widgets) {
    if (!widget?.id) continue;
    if (widget.widgetType === "TEXT" || widget.widgetType === "IMAGE") continue;
    const existing = snapshotByWidget.get(widget.id);
    if (existing && existing.data && typeof existing.data === "object") continue;
    if (!widget.source || !Array.isArray(widget.metrics) || !widget.metrics.length) continue;

    const connectionId = widget.connectionId || connectionMap.get(widget.source) || null;
    if (!connectionId) {
      snapshotByWidget.set(widget.id, {
        ...(existing || {}),
        widgetId: widget.id,
        error: "Sem conexao para esta fonte.",
      });
      continue;
    }

    try {
      const requestedMetrics = Array.isArray(widget.metrics) ? widget.metrics : [];
      const calculatedConfig = await reportingCalculated.prepareCalculatedMetrics(
        tenantId,
        { source: widget.source, level: widget.level },
        requestedMetrics
      );
      const metricsToQuery =
        calculatedConfig.baseMetrics && calculatedConfig.baseMetrics.length
          ? calculatedConfig.baseMetrics
          : requestedMetrics;

      const emptyData = {
        totals: {},
        series: [],
        table: [],
        meta: { source: widget.source },
      };

      const result = metricsToQuery.length
        ? await reportingData.queryMetrics(
            tenantId,
            {
              source: widget.source,
              connectionId,
              dateFrom: report.dateFrom,
              dateTo: report.dateTo,
              compareMode: report.compareMode,
              compareDateFrom: report.compareDateFrom,
              compareDateTo: report.compareDateTo,
              level: widget.level,
              breakdown: widget.breakdown,
              metrics: metricsToQuery,
              filters: widget.filters || null,
              options: widget.options || null,
              widgetType: widget.widgetType,
            },
            scope
          )
        : { data: emptyData, cacheKey: null };

      const applied = reportingCalculated.applyCalculatedMetricsToData(
        { source: widget.source, level: widget.level },
        result?.data || emptyData,
        requestedMetrics,
        calculatedConfig.calculatedDefs
      );

      const snapshotKey = cache.buildReportSnapshotKey(
        tenantId,
        report.id,
        widget.id
      );
      const generatedAt = new Date().toISOString();
      const snapshotValue = {
        widgetId: widget.id,
        reportId: report.id,
        generatedAt,
        cacheKey: result.cacheKey,
        data: applied.data || result.data,
      };
      await cache.setReportSnapshot(snapshotKey, snapshotValue);
      snapshotByWidget.set(widget.id, {
        widgetId: widget.id,
        cacheKey: result.cacheKey,
        generatedAt,
        data: applied.data || result.data,
      });
    } catch (err) {
      snapshotByWidget.set(widget.id, {
        ...(existing || {}),
        widgetId: widget.id,
        error: err?.message || "Falha ao gerar snapshot.",
      });
    }
  }

  return {
    reportId: report.id,
    items: widgets.map((widget) =>
      snapshotByWidget.get(widget.id) || {
        widgetId: widget.id,
        cacheKey: null,
        generatedAt: null,
        data: null,
      }
    ),
  };
}

function renderTotals(totals = {}) {
  const entries = Object.entries(totals || {});
  if (!entries.length) return "<p class=\"muted\">Sem totais.</p>";
  return `
    <div class="totals">
      ${entries
        .map(
          ([key, val]) => `
            <div class="total-item">
              <span class="total-key">${escapeHtml(key)}</span>
              <span class="total-val">${escapeHtml(val)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTable(table = []) {
  if (!Array.isArray(table) || !table.length) {
    return "<p class=\"muted\">Sem tabela.</p>";
  }

  const rows = table.slice(0, 25);
  const columns = Object.keys(rows[0] || {});
  if (!columns.length) return "<p class=\"muted\">Sem colunas.</p>";

  return `
    <table class="table">
      <thead>
        <tr>${columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
            <tr>
              ${columns
                .map((col) => `<td>${escapeHtml(row[col])}</td>`)
                .join("")}
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderWidget(widget, snapshot) {
  const title = widget.title || `Widget ${widget.id || ""}`.trim();
  const data = snapshot?.data || null;
  const errorNote = snapshot?.error || data?.meta?.error || "";
  const totals = data?.totals || {};
  const table = data?.table || [];
  const series = data?.series || [];

  return `
    <section class="widget">
      <div class="widget-header">
        <div>
          <p class="widget-type">${escapeHtml(widget.widgetType || "WIDGET")}</p>
          <h3>${escapeHtml(title || "Widget")}</h3>
        </div>
        <div class="widget-meta">
          <span>${escapeHtml(widget.source || "N/A")}</span>
          <span>${escapeHtml(widget.level || "")}</span>
        </div>
      </div>
      <div class="widget-body">
        ${errorNote ? `<p class="muted">Aviso: ${escapeHtml(errorNote)}</p>` : ""}
        ${renderTotals(totals)}
        ${renderTable(table)}
        ${
          Array.isArray(series) && series.length
            ? `<p class="muted">Series: ${escapeHtml(series.length)} ponto(s).</p>`
            : ""
        }
      </div>
    </section>
  `;
}

function renderReportHtml(report, snapshotItems) {
  const snapshotsByWidget = new Map();
  (snapshotItems || []).forEach((item) => {
    if (item?.widgetId) snapshotsByWidget.set(item.widgetId, item);
  });

  const widgets = Array.isArray(report.widgets) ? report.widgets : [];
  const dateFrom = formatDate(report.dateFrom);
  const dateTo = formatDate(report.dateTo);
  const scopeLabel =
    report.scope === "GROUP" ? "Grupo" : report.scope === "BRAND" ? "Marca" : "Tenant";
  const scopeName =
    report.brand?.name || report.group?.name || report.params?.brandId || report.params?.groupId;

  const widgetsHtml = widgets
    .map((widget) => renderWidget(widget, snapshotsByWidget.get(widget.id)))
    .join("");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(report.name || "Relatorio")}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Manrope", "Helvetica Neue", Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 32px;
            background: #f9fafb;
          }
          header {
            padding: 24px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            margin-bottom: 24px;
          }
          header h1 { margin: 0 0 8px; font-size: 24px; }
          header .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 12px;
            color: #6b7280;
          }
          .widgets {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
          .widget {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 16px;
            page-break-inside: avoid;
          }
          .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
          .widget-header h3 {
            margin: 4px 0 0;
            font-size: 16px;
          }
          .widget-type {
            margin: 0;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #9ca3af;
          }
          .widget-meta {
            display: flex;
            flex-direction: column;
            text-align: right;
            font-size: 11px;
            color: #6b7280;
          }
          .widget-body { margin-top: 12px; }
          .totals {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 12px;
          }
          .total-item {
            padding: 8px 10px;
            border-radius: 10px;
            background: #f3f4f6;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          .total-key { color: #6b7280; }
          .total-val { font-weight: 600; }
          .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          .table th,
          .table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }
          .table th {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #6b7280;
          }
          .muted { color: #9ca3af; font-size: 11px; }
          @media print {
            body { background: #ffffff; }
            header, .widget { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(report.name || "Relatorio")}</h1>
          <div class="meta">
            <span>Escopo: ${escapeHtml(scopeLabel)}</span>
            ${scopeName ? `<span>${escapeHtml(scopeName)}</span>` : ""}
            ${dateFrom || dateTo ? `<span>Periodo: ${escapeHtml(dateFrom)} a ${escapeHtml(dateTo)}</span>` : ""}
            <span>Status: ${escapeHtml(report.status || "DRAFT")}</span>
            <span>Gerado em: ${escapeHtml(new Date().toISOString())}</span>
          </div>
        </header>
        <main class="widgets">
          ${widgetsHtml || "<p class=\"muted\">Sem widgets.</p>"}
        </main>
      </body>
    </html>
  `;
}

async function generatePdfFromHtml(html) {
  let playwright;
  try {
    playwright = require("playwright");
  } catch (err) {
    const error = new Error("Playwright nao instalado. Rode npm install playwright.");
    error.code = "PLAYWRIGHT_MISSING";
    throw error;
  }

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });
    await page.close();
    return buffer;
  } finally {
    await browser.close();
  }
}

async function createReportExport(tenantId, reportId, scope) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, tenantId },
    include: {
      widgets: true,
      brand: true,
      group: true,
    },
  });

  if (!report) {
    const err = new Error("Relatorio nao encontrado");
    err.statusCode = 404;
    throw err;
  }
  if (hasBrandScope(scope) && !isBrandAllowed(scope, report.brandId)) {
    const err = new Error("Acesso negado para este cliente");
    err.statusCode = 403;
    throw err;
  }

  const exportRecord = await prisma.reportExport.create({
    data: {
      tenantId,
      reportId: report.id,
      status: "PROCESSING",
      format: "PDF",
    },
  });

  try {
    const snapshots = await ensureSnapshotsForReport(tenantId, report, scope);
    const html = renderReportHtml(report, snapshots?.items || []);
    const pdfBuffer = await generatePdfFromHtml(html);

    const exportSuffix = exportRecord.id.slice(0, 6);
    const filename = `${slugify(report.name || "relatorio")}-${report.id.slice(
      0,
      6,
    )}-${exportSuffix}.pdf`;
    const key = `${tenantId}/reports/${report.id}/${filename}`;

    const uploadResult = await uploadsService.uploadBuffer(pdfBuffer, filename, "application/pdf", {
      key,
      metadata: {
        reportId: report.id,
        exportId: exportRecord.id,
      },
    });

    const uploadRecord = await prisma.upload.create({
      data: {
        tenantId,
        key: uploadResult.key,
        url: uploadResult.url,
        filename,
        size: pdfBuffer.length,
        mimeType: "application/pdf",
        metadata: {
          reportId: report.id,
          exportId: exportRecord.id,
          generatedBy: "reportingExport",
        },
      },
    });

    const updated = await prisma.reportExport.update({
      where: { id: exportRecord.id },
      data: {
        status: "READY",
        fileId: uploadRecord.id,
        meta: {
          generatedAt: new Date().toISOString(),
          widgetCount: report.widgets?.length || 0,
          filename,
        },
      },
      include: { file: true },
    });

    return {
      export: updated,
      file: uploadRecord,
      url: uploadRecord.url,
    };
  } catch (err) {
    await prisma.reportExport.update({
      where: { id: exportRecord.id },
      data: {
        status: "ERROR",
        meta: {
          error: err?.message || "Falha ao gerar PDF",
        },
      },
    });
    throw err;
  }
}

async function listReportExports(tenantId, reportId, scope) {
  if (hasBrandScope(scope)) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, tenantId },
      select: { brandId: true },
    });
    if (!report) return [];
    if (!isBrandAllowed(scope, report.brandId)) {
      const err = new Error("Acesso negado para este cliente");
      err.statusCode = 403;
      throw err;
    }
  }
  return prisma.reportExport.findMany({
    where: { tenantId, reportId },
    orderBy: { createdAt: "desc" },
    include: { file: true },
  });
}

async function getReportExport(tenantId, exportId, scope) {
  if (!exportId) return null;
  const record = await prisma.reportExport.findFirst({
    where: { id: exportId, tenantId },
    include: { file: true, report: true },
  });
  if (!record) return null;
  if (hasBrandScope(scope) && !isBrandAllowed(scope, record.report?.brandId)) {
    const err = new Error("Acesso negado para este cliente");
    err.statusCode = 403;
    throw err;
  }
  return record;
}

module.exports = {
  createReportExport,
  listReportExports,
  getReportExport,
};
