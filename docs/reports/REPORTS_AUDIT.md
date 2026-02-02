# REPORTS AUDIT (Kondor Studio)
Data da auditoria: 2026-02-01

## Escopo
Auditoria cirúrgica do módulo atual de Relatórios no front e back (inclui o módulo novo `reporting` + legado `/reports`), com mapeamento de arquivos, fluxo de dados, riscos e plano de migração para Reports V2 usando feature flag `reportsV2`.

---

## 1) Mapa de arquivos (path + resumo)

### Frontend (rotas, páginas, componentes, client)
- `front/src/app.jsx` — Rotas de `/reports`, `/reports/templates`, `/reports/dashboards` e `/admin/reports`.
- `front/src/layout.jsx` — Menu lateral “Relatorios” e consulta status de conexões (`reporting-connections-status`).
- `front/src/pages/reports/ReportsHome.jsx` — Home de relatórios (lista reports, conexões, ações rápidas, editar/excluir/refresh).
- `front/src/pages/reports/ReportsWizard.jsx` — Wizard de criação de relatório (escopo, marca/grupo, template, período).
- `front/src/pages/reports/ReportViewer.jsx` — Visualização do relatório + snapshots + refresh + export.
- `front/src/pages/reports/ReportsTemplates.jsx` — Listagem/duplicação de templates.
- `front/src/pages/reports/ReportsTemplateBuilder.jsx` — Builder de templates (layout + widgets).
- `front/src/pages/reports/DashboardsHome.jsx` — Home de dashboards.
- `front/src/pages/reports/DashboardBuilder.jsx` — Builder de dashboards (widgets + filtros globais + templates locais).
- `front/src/pages/reports/DashboardViewer.jsx` — Visualização de dashboard + query ao vivo.
- `front/src/pages/admin/AdminLayout.jsx` — Menu admin com “Relatorios”.
- `front/src/pages/admin/AdminReports.jsx` — Painel admin de métricas executivas (não é reporting operacional).
- `front/src/pages/analytics/dashboards.jsx` — Dashboards GA4 (módulo analytics, reutiliza componentes de reports).
- `front/src/pages/analytics/dashboardBuilder.jsx` — Builder GA4 (usa `DashboardCanvas` e widgets).
- `front/src/pages/integrations.jsx` — Copy/marketing mencionando relatórios.
- `front/src/components/reports/ReportsIntro.jsx` — Hero/intro do módulo (UI).
- `front/src/components/reports/ConnectDataSourceDialog.jsx` — Conectar fontes de dados (integrações/contas/connections).
- `front/src/components/reports/MetricCatalogPanel.jsx` — CRUD de catálogo de métricas/dimensões.
- `front/src/components/reports/MetricMultiSelect.jsx` — Seleção de métricas/dimensões.
- `front/src/components/reports/SortableChips.jsx` — Ordenação de métricas.
- `front/src/components/reports/UnderlineTabs.jsx` — Tabs do builder.
- `front/src/components/reports/AlertBanner.jsx` — Banner informativo.
- `front/src/components/reports/dashboards/dashboardTemplates.js` — Templates locais de dashboard (mock/presets).
- `front/src/components/reports/dashboards/dashboardUtils.js` — Normalização de widgets/layouts.
- `front/src/components/reports/utils/connectionResolver.js` — Resolve conexão por fonte.
- `front/src/components/reports/widgets/DashboardCanvas.jsx` — Grid/layout de widgets.
- `front/src/components/reports/widgets/WidgetRenderer.jsx` — Renderiza KPI/Chart/Table; chama `/reporting/metrics/query`.
- `front/src/components/reports/widgets/WidgetCard.jsx` — Card padrão do widget.
- `front/src/components/reports/widgets/WidgetEmptyState.jsx` — Estado vazio.
- `front/src/components/reports/widgets/WidgetErrorState.jsx` — Estado de erro.
- `front/src/components/reports/widgets/WidgetSkeleton.jsx` — Loading.
- `front/src/components/reports/widgets/WidgetStates.jsx` — Estado combinado (loading/erro/empty).
- `front/src/components/reports/widgets/EmptyStateCard.jsx` — Empty card.
- `front/src/components/reports/widgets/widgetMeta.js` — Metadados de widgets/fontes (labels/ícones).
- `front/src/components/reports/widgets/widgetQueryKey.js` — Key estável de query p/ React Query.
- `front/src/apiClient/base44Client.js` — Client `/reporting/*`, `/reports/*` e `/analytics/*`.
- `front/src/entities/report.jsx` — Schema JSON legado (relatórios PDF antigos).
- `front/src/utils/adminPermissions.js` — Permissão `reports.read`.
- `front/src/styles/global.css` — Tokens visuais da superfície `reporting-surface`.
- `front/tests/reports-phase6.spec.js` — Testes Playwright com API mockada (relatórios/dashboards).

### Backend (rotas, controllers, services, jobs, providers)
- `api/src/routes/reporting.js` — Entry point do módulo `/reporting` (auth+tenant).
- `api/src/modules/reporting/reporting.routes.js` — Rotas REST do reporting (templates, reports, dashboards, metrics, schedules, exports, deliveries).
- `api/src/modules/reporting/reportingAccess.middleware.js` — RBAC (`viewer/editor/admin`).
- `api/src/modules/reporting/reportingScope.service.js` — Escopo por marca (client portal/permissions).
- `api/src/modules/reporting/reportingAudit.service.js` — Log de ações.
- `api/src/modules/reporting/brandGroups.controller.js` + `brandGroups.service.js` — Listagem de grupos de marcas.
- `api/src/modules/reporting/connections.controller.js` + `connections.service.js` + `connections.validators.js` — DataSourceConnection (link/list/GA4 metadata/compat).
- `api/src/modules/reporting/metricCatalog.controller.js` + `metricCatalog.service.js` + `metricCatalog.validators.js` — Catálogo de métricas/dimensões.
- `api/src/modules/reporting/templates.controller.js` + `templates.service.js` + `templates.validators.js` — Templates de relatório (versionamento).
- `api/src/modules/reporting/reports.controller.js` + `reports.service.js` + `reports.validators.js` — CRUD de reports + layout + refresh + snapshots.
- `api/src/modules/reporting/dashboards.controller.js` + `dashboards.service.js` + `dashboards.validators.js` — CRUD dashboards + query ao vivo.
- `api/src/modules/reporting/reportingMetrics.controller.js` + `reportingMetrics.service.js` — Endpoint `/reporting/metrics/query` (inclui mock/metrics calculadas).
- `api/src/modules/reporting/reportingData.service.js` — Consulta dados via adapters + cache.
- `api/src/modules/reporting/reportingCalculated.service.js` — Métricas calculadas (formula no catálogo).
- `api/src/modules/reporting/reportingGeneration.service.js` — Geração de snapshots de relatório.
- `api/src/modules/reporting/reportingJobs.service.js` — Enfileira geração (Bull) ou executa inline.
- `api/src/modules/reporting/reportingSnapshots.service.js` — Recupera snapshots do cache.
- `api/src/modules/reporting/reportingCache.service.js` — Redis/memory cache.
- `api/src/modules/reporting/reportExports.controller.js` + `reportExports.service.js` — Exportação PDF (Playwright + uploads).
- `api/src/modules/reporting/reportDeliveries.controller.js` + `reportDeliveries.service.js` — Cria/consulta entregas (não envia).
- `api/src/modules/reporting/reportSchedules.controller.js` + `reportSchedules.service.js` + `reportSchedules.validators.js` — Agendamentos + geração + email.
- `api/src/modules/reporting/providers/*` — Adapters por fonte (Meta, Google Ads, GA4, TikTok, LinkedIn, GBP, Meta Social) + `providerUtils`.
- `api/src/routes/reports.js` — Rotas legadas `/reports` (PDF e envio).
- `api/src/services/reportBuilder.js` — Gera PDF/TXT legado e salva Upload.
- `api/src/services/reportsService.js` — CRUD legado de reports (tabela `reports`).
- `api/src/jobs/reportGenerationJob.js` — Worker legado baseado em `jobQueue`.
- `api/src/services/schedulerService.js` — Agendamento legado via `reportsQueue`.
- `api/src/jobs/reportingGenerateJob.js` — Worker do reporting (gera snapshots).
- `api/src/jobs/reportScheduleJob.js` — Worker de schedules (reporting).
- `api/src/services/*MetricsService.js` — Integrações de métricas (meta/google/tiktok/linkedin/ga4).
- `api/src/services/ga4MetadataService.js` + `ga4IntegrationResolver.js` — Suporte GA4 (metadata/resolução de integração).
- `api/src/services/automationEngine.js` — Evento `report.ready` (WhatsApp legado).
- `api/src/services/automationSettingsService.js` — Configuração de automação de reports (legado).
- `api/scripts/validate-report-filters.js` — Script para validar filtros no reporting.
- `api/prisma/schema.prisma` — Modelos/tabelas de reports/dashboards.
- `api/prisma/seed.js` — Seeds de templates e catálogo de métricas.
- `api/prisma/migrations/20251202135946_add_permissions_to_team_member/migration.sql` — Tabela `reports` (legado).
- `api/prisma/migrations/20260109164136_reporting_stage_1/migration.sql` — `report_templates`, `report_widgets`, `report_exports`, `report_schedules`.
- `api/prisma/migrations/20260131123000_report_deliveries/migration.sql` — `report_deliveries`.

---

## 2) Fluxo atual (de onde vêm os dados)

### 2.1 Reporting (módulo novo `/reporting`)
1. **Templates/Widgets**
   - `ReportsTemplateBuilder` chama `/reporting/metric-catalog` e `/reporting/dimensions`.
   - Salva templates em `report_templates` (schema: layout + widgets).
   - Seed inicial em `api/prisma/seed.js`.

2. **Criação de relatório**
   - `ReportsWizard` → `POST /reporting/reports`.
   - `reports.service` copia `layoutSchema/widgetsSchema` do template para `report.snapshotTemplate` e cria `report_widgets`.
   - Status inicial: `DRAFT`.

3. **Geração de dados (snapshots)**
   - `ReportViewer` chama `POST /reporting/reports/:id/refresh`.
   - `reportingJobs.service` enfileira ou executa `reportingGeneration.generateReportData`.
   - `reportingData.service` consulta adapters externos → cache Redis/memory.
   - Snapshots ficam no cache (`reportingCache.service`), não no DB.
   - Report atualizado para `READY` ou `ERROR` e registra erros em `report.params.reporting`.

4. **Visualização**
   - `GET /reporting/reports/:id` retorna report + widgets.
   - `GET /reporting/reports/:id/snapshots` retorna snapshots do cache.

5. **Dashboards**
   - `DashboardsHome` lista; `DashboardBuilder` cria/edita; `DashboardViewer` executa query ao vivo.
   - `dashboards.service` consulta adapters diretamente (sem snapshots persistentes).

6. **Exports**
   - `POST /reporting/reports/:id/exports` → `reportExports.service`.
   - Gera HTML + PDF (Playwright), salva `upload` e `report_exports`.

7. **Schedules**
   - `reportSchedules.service` cria schedule e enfileira via Bull.
   - `runSchedule` cria report → gera snapshots → exporta PDF → envia emails (emailService).

### 2.2 Legado (`/reports`)
1. **Geração**
   - `POST /reports/generate` cria `report` (tabela `reports`) e enfileira job `report_generation` (jobQueue).
   - `reportGenerationJob` usa `metrics` coletadas (tabela `metrics`) para gerar PDF/TXT via `reportBuilder`.

2. **Envio**
   - `POST /reports/:id/send` tenta envio WhatsApp (provider opcional) ou marca envio por email (placeholder).

3. **Download**
   - `GET /reports/:id/download` retorna URL do Upload (se existir).

### 2.3 Fontes de dados
- **Adapters** (reporting): `META_ADS`, `GOOGLE_ADS`, `GA4`, `TIKTOK_ADS`, `LINKEDIN_ADS` usam serviços reais.
- **Mocked/Parcial**: `META_SOCIAL` e `GBP` retornam dados mockados (sem implementação de métricas).
- **Cache**: Redis (se disponível) + fallback in-memory.
- **Uploads**: `uploadsService` para PDF/export.
- **Email**: `emailService` para schedules.
- **WhatsApp**: `whatsappProvider` (legado).

---

## 3) O que é mock x real x integrado

### (a) UI mock / placeholders
- `front/src/components/reports/ReportsIntro.jsx` — cards estáticos (“Automacoes em breve”).
- `front/src/components/reports/dashboards/dashboardTemplates.js` — templates locais (presets) não vêm do backend.
- Preview de widgets no `ReportsTemplateBuilder` roda sem conexão real (exibe vazio ou estados locais).
- `front/src/entities/report.jsx` — schema legado não conectado ao fluxo novo.

### (b) API real com dados funcionando
- `/reporting/*` — templates, reports, dashboards, catálogo, métricas, exports, schedules (persistem via Prisma).
- `/reports/*` (legado) — geração de PDF/TXT usando tabela `metrics` + Upload.
- `report_exports` + `uploads` — geração real de PDF (Playwright + uploadsService).

### (c) Acoplado a integrações externas
- `api/src/modules/reporting/providers/*` → Meta/Google/TikTok/LinkedIn/GA4/GBP.
- `api/src/services/*MetricsService.js` e GA4 (`ga4DataService`, `ga4MetadataService`).
- `uploadsService` (storage), `emailService` (envio), `whatsappProvider` (legado), Redis (cache), Bull queues (jobs/schedules).

---

## 4) Modelos Prisma / Tabelas relacionadas

Principais modelos (schema atual):
- `Report` → tabela `reports` (legado + reporting, status e params divergentes).
- `ReportTemplate` → `report_templates`.
- `ReportWidget` → `report_widgets`.
- `ReportExport` → `report_exports`.
- `ReportDelivery` → `report_deliveries`.
- `ReportSchedule` → `report_schedules`.
- `Dashboard` → `dashboards`.
- `MetricCatalog` → `metric_catalog`.
- `DataSourceConnection` → `data_source_connections`.
- `BrandGroup`/`BrandGroupMember` → `brand_groups`/`brand_group_members`.
- `Upload` → `uploads` (PDFs).

Enums relevantes: `ReportScope`, `ReportCompareMode`, `ReportWidgetType`, `ReportExportStatus`, `ReportDeliveryChannel`, `ReportScheduleFrequency`, `DashboardScope`.

---

## 5) Dívidas técnicas e riscos
- **Dois sistemas concorrentes** (`/reports` legado vs `/reporting` novo) usando a mesma tabela `reports`, com semânticas diferentes de `type/status/params`.
- **Snapshots não persistidos**: dados de widgets ficam em Redis/memory; se cache perder, relatório fica sem dados.
- **Adapters parcialmente implementados**: `META_SOCIAL` e `GBP` retornam dados mockados.
- **Dependência Playwright**: export PDF falha se `playwright` não instalado.
- **Deliveries sem envio**: `/reporting/reports/:id/deliveries` apenas grava; não dispara envio.
- **Schedules dependem de emailService e filas**: sem configuração, execução falha ou roda inline.
- **Bug potencial**: `tiktokAds.adapter.js` e `linkedinAds.adapter.js` usam `getIntegrationSettings` sem import (risco de runtime error em listSelectableAccounts).
- **Duplicação de lógica no front**: builders de report templates vs dashboards têm fluxos similares, pouca reutilização.
- **Observabilidade limitada**: erros de geração ficam em `report.params.reporting.errors` sem tracking centralizado.

---

## 6) Proposta de reaproveitamento mínimo (manter vs substituir)

### Manter (mínimo reaproveitado)
- **Rotas e menu**: `/reports`, `/reports/templates`, `/reports/dashboards` (evitar quebra de URLs).
- **Backend `reporting`**: routes + services (`reports`, `templates`, `dashboards`, `metrics`, `exports`, `schedules`).
- **Modelos Prisma**: `report_templates`, `report_widgets`, `report_exports`, `report_schedules`, `dashboards`, `metric_catalog`, `data_source_connections`.
- **Componentes core**: `WidgetRenderer`, `DashboardCanvas`, `MetricMultiSelect`, `ConnectDataSourceDialog`.
- **Adapters com dados reais**: `META_ADS`, `GOOGLE_ADS`, `GA4`, `TIKTOK_ADS`, `LINKEDIN_ADS`.

### Deletar/Substituir (ou descontinuar após migração)
- **Legado `/reports`**: `api/src/routes/reports.js`, `reportBuilder`, `reportsService`, `reportGenerationJob`, `schedulerService` (relatórios PDF antigos).
- **Schema front legado**: `front/src/entities/report.jsx`.
- **Automação antiga**: ajustes em `automationEngine/automationSettingsService` relacionados a reports.
- **Templates locais de dashboard**: migrar para templates no backend (ou manter apenas como presets opcionais).

---

## 7) Plano de migração para Reports V2 (feature flag `reportsV2`)

### Fase 0 — Preparação (sem impacto)
- Adicionar flag `reportsV2` em config/tenant (expor via `/auth/me` ou settings).
- Criar rota alternativa no front (`/reports-v2`) e manter `/reports` atual.

### Fase 1 — V2 em paralelo (read-only)
- Implementar UI V2 consumindo **os mesmos endpoints `/reporting/*`** para reduzir risco.
- Flag `reportsV2=false` mantém UI atual; `true` direciona para UI V2.

### Fase 2 — Escrita controlada
- Para tenants com `reportsV2=true`, **dual-write** apenas quando necessário (ex.: novos campos no `Report.params`).
- Se precisar de novos dados, adicionar colunas/JSON em `report_templates`/`reports` sem quebrar leitura V1.

### Fase 3 — Rollout gradual
- Ativar `reportsV2` por tenant (piloto interno → 5% → 25% → 100%).
- Monitorar: erros de geração, tempo de export, falhas de adapters, cache hit.

### Fase 4 — Depreciação do legado
- Após migração total, congelar `/reports` legado (read-only → desligar).
- Remover `reportBuilder`, `reportGenerationJob`, `schedulerService` (relatórios antigos) e schema front legado.

### Fase 5 — Consolidação
- Documentar fluxo único (`/reporting`) e remover rotas/menus duplicados.
- Migrar presets locais para templates persistidos (opcional).

---

## Observações finais
- O módulo `/reporting` já cobre a maior parte do V2 (templates, dashboards, métricas, export, schedules). O risco principal hoje é a coexistência com o legado e a dependência de cache/integrações.
- O plano acima preserva rotas/menus e permite migração sem interromper produção.
