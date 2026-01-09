import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GridLayout, { useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { base44 } from "@/apiClient/base44Client";
import PageShell from "@/components/ui/page-shell.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { SelectNative } from "@/components/ui/select-native.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";

const WIDGET_TYPES = [
  { key: "KPI", label: "KPI" },
  { key: "LINE", label: "Linha" },
  { key: "BAR", label: "Barra" },
  { key: "PIE", label: "Pizza" },
  { key: "TABLE", label: "Tabela" },
  { key: "TEXT", label: "Texto" },
  { key: "IMAGE", label: "Imagem" },
];

const SOURCE_OPTIONS = [
  { value: "META_ADS", label: "Meta Ads" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "TIKTOK_ADS", label: "TikTok Ads" },
  { value: "LINKEDIN_ADS", label: "LinkedIn Ads" },
  { value: "GA4", label: "GA4" },
  { value: "GBP", label: "Google Business Profile" },
  { value: "META_SOCIAL", label: "Meta Social" },
];

const VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "Privado" },
  { value: "TENANT", label: "Tenant" },
  { value: "PUBLIC", label: "Publico" },
];

function createWidgetId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getNextY(layout) {
  if (!layout.length) return 0;
  return layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
}

function createLayoutItem(id, layout) {
  const nextY = getNextY(layout);
  const nextX = (layout.length * 4) % 12;
  return {
    i: id,
    x: nextX,
    y: nextY,
    w: 4,
    h: 4,
  };
}

function normalizeLayout(layout = []) {
  return Array.isArray(layout) ? layout : [];
}

function normalizeWidgets(widgets = []) {
  return Array.isArray(widgets) ? widgets : [];
}

function WidgetConfigDialog({ open, onOpenChange, widget, onSave }) {
  const [draft, setDraft] = useState(widget);

  useEffect(() => {
    if (!open) return;
    setDraft(widget);
  }, [open, widget]);

  const source = draft?.source || "";
  const level = draft?.level || "";
  const widgetType = draft?.widgetType || "KPI";

  const { data: metricsData } = useQuery({
    queryKey: ["reporting-metric-catalog", source, level, widgetType],
    queryFn: async () => {
      if (!source || !level) return { items: [] };
      return base44.reporting.listMetricCatalog({ source, level, type: "METRIC" });
    },
    enabled: open && Boolean(source) && Boolean(level),
  });

  const { data: dimensionsData } = useQuery({
    queryKey: ["reporting-dimensions", source, level, widgetType],
    queryFn: async () => {
      if (!source || !level) return { items: [] };
      return base44.reporting.listDimensions({ source, level });
    },
    enabled: open && Boolean(source) && Boolean(level),
  });

  const metrics = useMemo(() => {
    const list = metricsData?.items || [];
    return list.filter((metric) => {
      if (!metric.supportedCharts || !metric.supportedCharts.length) return true;
      return metric.supportedCharts.includes(widgetType);
    });
  }, [metricsData, widgetType]);

  const dimensions = useMemo(() => {
    const list = dimensionsData?.items || [];
    return list.filter((dimension) => {
      if (!dimension.supportedCharts || !dimension.supportedCharts.length) return true;
      return dimension.supportedCharts.includes(widgetType);
    });
  }, [dimensionsData, widgetType]);

  if (!draft) return null;

  const selectedMetrics = Array.isArray(draft.metrics) ? draft.metrics : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurar widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Titulo</Label>
            <Input
              value={draft.title || ""}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Fonte</Label>
              <SelectNative
                value={source}
                onChange={(event) =>
                  setDraft({ ...draft, source: event.target.value })
                }
              >
                <option value="">Selecione</option>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div>
              <Label>Nivel</Label>
              <Input
                value={level}
                onChange={(event) => setDraft({ ...draft, level: event.target.value })}
                placeholder="CAMPAIGN / ADSET / PROPERTY"
              />
            </div>
          </div>

          <div>
            <Label>Breakdown</Label>
            <SelectNative
              value={draft.breakdown || ""}
              onChange={(event) =>
                setDraft({ ...draft, breakdown: event.target.value })
              }
            >
              <option value="">Sem breakdown</option>
              {dimensions.map((dimension) => (
                <option key={dimension.id} value={dimension.metricKey}>
                  {dimension.label}
                </option>
              ))}
            </SelectNative>
          </div>

          <div>
            <Label>Metricas</Label>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {metrics.length ? (
                metrics.map((metric) => {
                  const checked = selectedMetrics.includes(metric.metricKey);
                  return (
                    <label
                      key={metric.id}
                      className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selectedMetrics, metric.metricKey]
                            : selectedMetrics.filter((key) => key !== metric.metricKey);
                          setDraft({ ...draft, metrics: next });
                        }}
                      />
                      <span className="text-[var(--text)]">{metric.label}</span>
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  Nenhuma metrica disponivel.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onSave({
                  ...draft,
                  metrics: Array.isArray(draft.metrics) ? draft.metrics : [],
                });
                onOpenChange(false);
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ open, onOpenChange, widgets, layout }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Preview do template</DialogTitle>
        </DialogHeader>
        <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-3">
          <GridLayout
            layout={layout}
            cols={12}
            rowHeight={32}
            width={960}
            isDraggable={false}
            isResizable={false}
            margin={[16, 16]}
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-3"
              >
                <p className="text-xs text-[var(--text-muted)]">{widget.widgetType}</p>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {widget.title || "Widget"}
                </p>
              </div>
            ))}
          </GridLayout>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ReportsTemplateBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { templateId } = useParams();
  const isNew = !templateId;
  const { width, containerRef } = useContainerWidth({
    measureBeforeMount: true,
    initialWidth: 960,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("TENANT");
  const [layout, setLayout] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState(null);
  const [error, setError] = useState("");

  const { data: template, isLoading } = useQuery({
    queryKey: ["reporting-template", templateId],
    queryFn: () => base44.reporting.getTemplate(templateId),
    enabled: Boolean(templateId),
  });

  useEffect(() => {
    if (!template) return;
    setName(template.name || "");
    setDescription(template.description || "");
    setVisibility(template.visibility || "TENANT");
    setLayout(normalizeLayout(template.layoutSchema));
    setWidgets(normalizeWidgets(template.widgetsSchema));
  }, [template]);

  useEffect(() => {
    if (isNew && !templateId) {
      setName("Novo template");
      setDescription("");
      setVisibility("TENANT");
      setLayout([]);
      setWidgets([]);
    }
  }, [isNew, templateId]);

  useEffect(() => {
    if (!widgets.length) return;
    setLayout((prev) => {
      const existing = new Set(prev.map((item) => item.i));
      const missing = widgets
        .filter((widget) => !existing.has(widget.id))
        .map((widget) => createLayoutItem(widget.id, prev));
      if (!missing.length) return prev;
      return [...prev, ...missing];
    });
  }, [widgets]);

  const activeWidget = useMemo(
    () => widgets.find((widget) => widget.id === activeWidgetId) || null,
    [widgets, activeWidgetId]
  );

  const addWidget = (type) => {
    const id = createWidgetId();
    const label = WIDGET_TYPES.find((item) => item.key === type)?.label || "Widget";
    const nextWidget = {
      id,
      widgetType: type,
      title: `${label} widget`,
      source: "",
      level: "",
      breakdown: "",
      metrics: [],
      filters: {},
      options: {},
    };
    setWidgets((prev) => [...prev, nextWidget]);
    setLayout((prev) => [...prev, createLayoutItem(id, prev)]);
    setActiveWidgetId(id);
    setConfigOpen(true);
  };

  const handleRemoveWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));
    setLayout((prev) => prev.filter((item) => item.i !== widgetId));
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isNew) {
        return base44.reporting.createTemplate(payload);
      }
      return base44.reporting.updateTemplate(templateId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reporting-templates"] });
      if (isNew) {
        navigate(`/reports/templates/${data.id}/edit`);
        return;
      }
      if (data.id && data.id !== templateId) {
        navigate(`/reports/templates/${data.id}/edit`);
      }
    },
    onError: (err) => {
      setError(err?.message || "Erro ao salvar template.");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => base44.reporting.duplicateTemplate(templateId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reporting-templates"] });
      if (data?.id) {
        navigate(`/reports/templates/${data.id}/edit`);
      }
    },
  });

  const handleSave = (nextVisibility) => {
    setError("");
    if (!name.trim()) {
      setError("Nome do template obrigatorio.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      visibility: nextVisibility || visibility,
      layoutSchema: layout,
      widgetsSchema: widgets,
    };
    saveMutation.mutate(payload);
  };

  if (!isNew && isLoading) {
    return (
      <PageShell>
        <div className="h-48 rounded-[18px] border border-[var(--border)] bg-white/70 animate-pulse" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Builder de templates
            </p>
            <h1 className="text-2xl font-semibold text-[var(--text)]">
              {isNew ? "Novo template" : name || "Template"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/reports/templates")}>
              Voltar
            </Button>
            {!isNew ? (
              <Button
                variant="ghost"
                onClick={() => duplicateMutation.mutate()}
                disabled={duplicateMutation.isLoading}
              >
                Duplicar
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <Button variant="secondary" onClick={() => handleSave("PUBLIC")}>
              Publicar
            </Button>
            <Button onClick={() => handleSave()} disabled={saveMutation.isLoading}>
              {saveMutation.isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-4 shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold text-[var(--text)]">Detalhes</p>
              <div className="mt-3 space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div>
                  <Label>Descricao</Label>
                  <Input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Visibilidade</Label>
                  <SelectNative
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                  >
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectNative>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-4 shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold text-[var(--text)]">Widgets</p>
              <div className="mt-3 grid gap-2">
                {WIDGET_TYPES.map((item) => (
                  <Button
                    key={item.key}
                    variant="secondary"
                    onClick={() => addWidget(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <div ref={containerRef}>
              <GridLayout
                layout={layout}
                cols={12}
                rowHeight={32}
                margin={[16, 16]}
                width={width}
                onLayoutChange={(nextLayout) => setLayout(nextLayout)}
              >
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="group rounded-[12px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {widget.widgetType}
                        </p>
                        <p className="text-sm font-semibold text-[var(--text)]">
                          {widget.title || "Widget"}
                        </p>
                        {widget.source ? (
                          <p className="text-xs text-[var(--text-muted)]">
                            {widget.source} {widget.level ? `• ${widget.level}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActiveWidgetId(widget.id);
                            setConfigOpen(true);
                          }}
                        >
                          Config
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveWidget(widget.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </GridLayout>
            </div>
          </section>
        </div>
      </div>

      <WidgetConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        widget={activeWidget}
        onSave={(updated) => {
          setWidgets((prev) =>
            prev.map((widget) => (widget.id === updated.id ? updated : widget))
          );
        }}
      />

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        widgets={widgets}
        layout={layout}
      />
    </PageShell>
  );
}
