# Integrações

Este guia resume os endpoints de integrações e como separar integrações da agência x cliente.

## Conceito
- Integrações da agência: usadas pela própria agência (ex.: WhatsApp).
- Integrações do cliente: uma por cliente (ex.: Meta, Google Analytics, TikTok, Instagram).

## Endpoints principais

### Listar integrações (geral)
`GET /api/integrations`

Query params:
- `provider`
- `status`
- `ownerType`
- `ownerKey`
- `clientId`
- `kind`
- `page`
- `perPage`

### Listar integrações de um cliente
`GET /api/clients/:clientId/integrations`

Query params:
- `provider`
- `status`
- `kind`
- `page`
- `perPage`

### Conectar integração de cliente (manual)
`POST /api/clients/:clientId/integrations/:provider/connect`

Body (exemplo):
```json
{
  "providerName": "Meta Business",
  "status": "CONNECTED",
  "settings": { "kind": "meta_business" }
}
```

## Observações
- Integrações do cliente sempre têm `ownerType=CLIENT`.
- Integrações da agência usam `ownerType=AGENCY` e `ownerKey=AGENCY`.
