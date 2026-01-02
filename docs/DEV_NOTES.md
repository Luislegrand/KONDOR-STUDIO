# Dev Notes

## Posts views
- `GET /api/posts?view=kanban&startDate=...&endDate=...&clientId=...&status=...&q=...`
  - Retorna `{ columns: { STATUS: { count, items } }, totals: { all } }`.
- `GET /api/posts?view=calendar&startDate=...&endDate=...&clientId=...&status=...&q=...`
  - Retorna `{ items: [{ id, title, status, scheduledDate, publishedDate, createdAt, date, clientId, metadata }] }`.

## Preferences
- Model: `UserPreference`
  - `postsViewMode`, `kanbanCollapsedColumns`, `lastFilters`.
- Endpoints:
  - `GET /api/me/preferences`
  - `PATCH /api/me/preferences`

Example payload:
```
{
  "postsViewMode": "kanban",
  "kanbanCollapsedColumns": { "DRAFT": true },
  "lastFilters": {
    "clientId": "...",
    "dateStart": "2026-01-01",
    "dateEnd": "2026-01-31",
    "status": ["DRAFT", "SCHEDULED"],
    "search": "campanha"
  }
}
```

## Status model (workflow)
- Workflow statuses (UI): `DRAFT`, `CONTENT`, `INTERNAL_APPROVAL`, `CLIENT_APPROVAL`, `CHANGES`, `SCHEDULING`, `SCHEDULED`, `DONE`.
- Mapeamento para `PostStatus`:
  - `DRAFT` -> `DRAFT`
  - `CONTENT` / `INTERNAL_APPROVAL` -> `IDEA`
  - `CLIENT_APPROVAL` -> `PENDING_APPROVAL`
  - `CHANGES` -> `DRAFT` (quando ha `clientFeedback`)
  - `SCHEDULING` -> `APPROVED`
  - `SCHEDULED` -> `SCHEDULED`
  - `DONE` -> `PUBLISHED` (tambem agrupa `ARCHIVED`, `FAILED`, `CANCELLED`)
- Persistencia do workflow ocorre em `post.metadata.workflowStatus`.

## Migrations
- Aplicar `api/prisma/migrations/20260102130415_add_user_preferences/migration.sql` com `npm run prisma:migrate:deploy`.
- O arquivo foi gerado manualmente por timeout ao conectar no banco remoto.
