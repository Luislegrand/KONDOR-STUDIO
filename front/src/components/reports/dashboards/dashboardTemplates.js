import { normalizeLayout, normalizeWidgets } from "./dashboardUtils.js";

function toDateKey(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildDefaultDateRange() {
  const today = new Date();
  const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { dateFrom: toDateKey(from), dateTo: toDateKey(today) };
}

const META_ADS_KPIS = [
  {
    id: "meta_kpi_spend",
    widgetType: "KPI",
    title: "Investimento",
    source: "META_ADS",
    level: "CAMPAIGN",
    metrics: ["spend"],
  },
  {
    id: "meta_kpi_impressions",
    widgetType: "KPI",
    title: "Impressões",
    source: "META_ADS",
    level: "CAMPAIGN",
    metrics: ["impressions"],
  },
  {
    id: "meta_kpi_clicks",
    widgetType: "KPI",
    title: "Cliques",
    source: "META_ADS",
    level: "CAMPAIGN",
    metrics: ["clicks"],
  },
  {
    id: "meta_kpi_ctr",
    widgetType: "KPI",
    title: "CTR",
    source: "META_ADS",
    level: "CAMPAIGN",
    metrics: ["ctr"],
  },
];

const GOOGLE_ADS_KPIS = [
  {
    id: "gads_kpi_cost",
    widgetType: "KPI",
    title: "Custo",
    source: "GOOGLE_ADS",
    level: "CAMPAIGN",
    metrics: ["cost"],
  },
  {
    id: "gads_kpi_impressions",
    widgetType: "KPI",
    title: "Impressões",
    source: "GOOGLE_ADS",
    level: "CAMPAIGN",
    metrics: ["impressions"],
  },
  {
    id: "gads_kpi_clicks",
    widgetType: "KPI",
    title: "Cliques",
    source: "GOOGLE_ADS",
    level: "CAMPAIGN",
    metrics: ["clicks"],
  },
  {
    id: "gads_kpi_ctr",
    widgetType: "KPI",
    title: "CTR",
    source: "GOOGLE_ADS",
    level: "CAMPAIGN",
    metrics: ["ctr"],
  },
];

const GA4_KPIS = [
  {
    id: "ga4_kpi_users",
    widgetType: "KPI",
    title: "Usuarios",
    source: "GA4",
    level: "PROPERTY",
    metrics: ["totalUsers"],
  },
  {
    id: "ga4_kpi_sessions",
    widgetType: "KPI",
    title: "Sessoes",
    source: "GA4",
    level: "PROPERTY",
    metrics: ["sessions"],
  },
  {
    id: "ga4_kpi_engaged",
    widgetType: "KPI",
    title: "Sessoes engajadas",
    source: "GA4",
    level: "PROPERTY",
    metrics: ["engagedSessions"],
  },
  {
    id: "ga4_kpi_engagement_rate",
    widgetType: "KPI",
    title: "Taxa de engajamento",
    source: "GA4",
    level: "PROPERTY",
    metrics: ["engagementRate"],
  },
];

const META_SOCIAL_KPIS = [
  {
    id: "social_kpi_impressions",
    widgetType: "KPI",
    title: "Impressões",
    source: "META_SOCIAL",
    level: "PAGE",
    metrics: ["impressions"],
  },
  {
    id: "social_kpi_reach",
    widgetType: "KPI",
    title: "Alcance",
    source: "META_SOCIAL",
    level: "PAGE",
    metrics: ["reach"],
  },
  {
    id: "social_kpi_engagements",
    widgetType: "KPI",
    title: "Engajamentos",
    source: "META_SOCIAL",
    level: "PAGE",
    metrics: ["engagements"],
  },
  {
    id: "social_kpi_followers",
    widgetType: "KPI",
    title: "Novos seguidores",
    source: "META_SOCIAL",
    level: "PAGE",
    metrics: ["followers"],
  },
];

const DEFAULT_LAYOUT = [
  { i: "kpi_1", x: 0, y: 0, w: 3, h: 3 },
  { i: "kpi_2", x: 3, y: 0, w: 3, h: 3 },
  { i: "kpi_3", x: 6, y: 0, w: 3, h: 3 },
  { i: "kpi_4", x: 9, y: 0, w: 3, h: 3 },
  { i: "chart_1", x: 0, y: 3, w: 8, h: 5 },
  { i: "chart_2", x: 8, y: 3, w: 4, h: 5 },
  { i: "table_1", x: 0, y: 8, w: 12, h: 6 },
];

function buildLayoutFromIds(ids) {
  const slots = DEFAULT_LAYOUT.slice(0, ids.length);
  return slots.map((slot, index) => ({
    ...slot,
    i: ids[index],
  }));
}

export const DASHBOARD_TEMPLATES = [
  {
    id: "meta_ads_overview",
    name: "Meta Ads — Visao geral",
    description: "KPIs essenciais e performance de campanhas.",
    primarySource: "META_ADS",
    defaultWidgets: [
      ...META_ADS_KPIS,
      {
        id: "meta_chart_spend",
        widgetType: "LINE",
        title: "Investimento ao longo do tempo",
        source: "META_ADS",
        level: "CAMPAIGN",
        metrics: ["spend"],
      },
      {
        id: "meta_chart_conversions",
        widgetType: "BAR",
        title: "Conversoes por campanha",
        source: "META_ADS",
        level: "CAMPAIGN",
        metrics: ["conversions"],
      },
      {
        id: "meta_table_campaigns",
        widgetType: "TABLE",
        title: "Campanhas com melhor desempenho",
        source: "META_ADS",
        level: "CAMPAIGN",
        metrics: ["spend", "conversions", "ctr"],
      },
    ],
    defaultLayout: buildLayoutFromIds([
      "meta_kpi_spend",
      "meta_kpi_impressions",
      "meta_kpi_clicks",
      "meta_kpi_ctr",
      "meta_chart_spend",
      "meta_chart_conversions",
      "meta_table_campaigns",
    ]),
  },
  {
    id: "google_ads_overview",
    name: "Google Ads — Visao geral",
    description: "KPIs e tendencias de performance.",
    primarySource: "GOOGLE_ADS",
    defaultWidgets: [
      ...GOOGLE_ADS_KPIS,
      {
        id: "gads_chart_cost",
        widgetType: "LINE",
        title: "Custo ao longo do tempo",
        source: "GOOGLE_ADS",
        level: "CAMPAIGN",
        metrics: ["cost"],
      },
      {
        id: "gads_chart_conversions",
        widgetType: "BAR",
        title: "Conversoes por campanha",
        source: "GOOGLE_ADS",
        level: "CAMPAIGN",
        metrics: ["conversions"],
      },
      {
        id: "gads_table_campaigns",
        widgetType: "TABLE",
        title: "Campanhas com melhor desempenho",
        source: "GOOGLE_ADS",
        level: "CAMPAIGN",
        metrics: ["cost", "conversions", "ctr"],
      },
    ],
    defaultLayout: buildLayoutFromIds([
      "gads_kpi_cost",
      "gads_kpi_impressions",
      "gads_kpi_clicks",
      "gads_kpi_ctr",
      "gads_chart_cost",
      "gads_chart_conversions",
      "gads_table_campaigns",
    ]),
  },
  {
    id: "ga4_overview",
    name: "GA4 — Visao geral",
    description: "Indicadores de audiencia e engajamento.",
    primarySource: "GA4",
    defaultWidgets: [
      ...GA4_KPIS,
      {
        id: "ga4_chart_sessions",
        widgetType: "LINE",
        title: "Sessoes ao longo do tempo",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["sessions"],
      },
      {
        id: "ga4_chart_events",
        widgetType: "BAR",
        title: "Eventos principais",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["eventCount"],
      },
      {
        id: "ga4_table_pages",
        widgetType: "TABLE",
        title: "Paginas mais vistas",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["screenPageViews"],
      },
    ],
    defaultLayout: buildLayoutFromIds([
      "ga4_kpi_users",
      "ga4_kpi_sessions",
      "ga4_kpi_engaged",
      "ga4_kpi_engagement_rate",
      "ga4_chart_sessions",
      "ga4_chart_events",
      "ga4_table_pages",
    ]),
  },
  {
    id: "ecommerce_overview",
    name: "E-commerce — Visao geral",
    description: "Receita, conversoes e investimento em midia.",
    primarySource: "GA4",
    defaultWidgets: [
      {
        id: "ecom_kpi_revenue",
        widgetType: "KPI",
        title: "Receita",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["purchaseRevenue"],
      },
      {
        id: "ecom_kpi_transactions",
        widgetType: "KPI",
        title: "Transacoes",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["transactions"],
      },
      {
        id: "ecom_kpi_sessions",
        widgetType: "KPI",
        title: "Sessoes",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["sessions"],
      },
      {
        id: "ecom_kpi_spend",
        widgetType: "KPI",
        title: "Investimento em midia",
        source: "META_ADS",
        level: "CAMPAIGN",
        metrics: ["spend"],
      },
      {
        id: "ecom_chart_revenue",
        widgetType: "LINE",
        title: "Receita ao longo do tempo",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["purchaseRevenue"],
      },
      {
        id: "ecom_chart_conversions",
        widgetType: "BAR",
        title: "Conversoes por campanha",
        source: "GOOGLE_ADS",
        level: "CAMPAIGN",
        metrics: ["conversions"],
      },
      {
        id: "ecom_table_campaigns",
        widgetType: "TABLE",
        title: "Campanhas com melhor ROAS",
        source: "META_ADS",
        level: "CAMPAIGN",
        metrics: ["spend", "conversions"],
      },
    ],
    defaultLayout: buildLayoutFromIds([
      "ecom_kpi_revenue",
      "ecom_kpi_transactions",
      "ecom_kpi_sessions",
      "ecom_kpi_spend",
      "ecom_chart_revenue",
      "ecom_chart_conversions",
      "ecom_table_campaigns",
    ]),
  },
  {
    id: "social_overview",
    name: "Social — Visao geral",
    description: "Engajamento e crescimento de audiencia.",
    primarySource: "META_SOCIAL",
    defaultWidgets: [
      ...META_SOCIAL_KPIS,
      {
        id: "social_chart_engagement",
        widgetType: "LINE",
        title: "Engajamento ao longo do tempo",
        source: "META_SOCIAL",
        level: "PAGE",
        metrics: ["engagements"],
      },
      {
        id: "social_chart_reach",
        widgetType: "BAR",
        title: "Alcance por conteudo",
        source: "META_SOCIAL",
        level: "PAGE",
        metrics: ["reach"],
      },
      {
        id: "social_table_posts",
        widgetType: "TABLE",
        title: "Posts com melhor desempenho",
        source: "META_SOCIAL",
        level: "PAGE",
        metrics: ["impressions", "engagements"],
      },
    ],
    defaultLayout: buildLayoutFromIds([
      "social_kpi_impressions",
      "social_kpi_reach",
      "social_kpi_engagements",
      "social_kpi_followers",
      "social_chart_engagement",
      "social_chart_reach",
      "social_table_posts",
    ]),
  },
];

export const WIDGET_PRESETS = {
  META_ADS: {
    kpis: META_ADS_KPIS.map(({ id, ...rest }) => rest),
    charts: [
      {
        widgetType: "LINE",
        title: "Investimento ao longo do tempo",
        source: "META_ADS",
        level: "CAMPAIGN",
        metrics: ["spend"],
      },
      {
        widgetType: "BAR",
        title: "Conversoes por campanha",
        source: "META_ADS",
        level: "CAMPAIGN",
        metrics: ["conversions"],
      },
    ],
  },
  GOOGLE_ADS: {
    kpis: GOOGLE_ADS_KPIS.map(({ id, ...rest }) => rest),
    charts: [
      {
        widgetType: "LINE",
        title: "Custo ao longo do tempo",
        source: "GOOGLE_ADS",
        level: "CAMPAIGN",
        metrics: ["cost"],
      },
      {
        widgetType: "BAR",
        title: "Conversoes por campanha",
        source: "GOOGLE_ADS",
        level: "CAMPAIGN",
        metrics: ["conversions"],
      },
    ],
  },
  GA4: {
    kpis: GA4_KPIS.map(({ id, ...rest }) => rest),
    charts: [
      {
        widgetType: "LINE",
        title: "Sessoes ao longo do tempo",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["sessions"],
      },
      {
        widgetType: "BAR",
        title: "Eventos principais",
        source: "GA4",
        level: "PROPERTY",
        metrics: ["eventCount"],
      },
    ],
  },
  META_SOCIAL: {
    kpis: META_SOCIAL_KPIS.map(({ id, ...rest }) => rest),
    charts: [
      {
        widgetType: "LINE",
        title: "Engajamento ao longo do tempo",
        source: "META_SOCIAL",
        level: "PAGE",
        metrics: ["engagements"],
      },
      {
        widgetType: "BAR",
        title: "Alcance por conteudo",
        source: "META_SOCIAL",
        level: "PAGE",
        metrics: ["reach"],
      },
    ],
  },
};

export function getRecommendedPresets(source) {
  if (!source) return WIDGET_PRESETS.META_ADS;
  return WIDGET_PRESETS[source] || WIDGET_PRESETS.META_ADS;
}

export function applyTemplate(
  templateId,
  { scope, brandId, groupId, globalBrandId, globalGroupId } = {}
) {
  const template =
    DASHBOARD_TEMPLATES.find((item) => item.id === templateId) ||
    DASHBOARD_TEMPLATES[0];

  if (!template) {
    return {
      name: "Novo dashboard",
      widgets: [],
      layout: [],
      globalFiltersDefaults: {
        ...buildDefaultDateRange(),
        compareMode: "NONE",
        dimensionFilters: [],
      },
    };
  }

  const widgets = normalizeWidgets(template.defaultWidgets);
  const layout = normalizeLayout(template.defaultLayout, widgets);
  const range = buildDefaultDateRange();

  return {
    name: template.name,
    widgets,
    layout,
    globalFiltersDefaults: {
      ...range,
      compareMode: "NONE",
      compareDateFrom: "",
      compareDateTo: "",
      dimensionFilters: [],
      scope,
      brandId,
      groupId,
      globalBrandId,
      globalGroupId,
    },
  };
}
