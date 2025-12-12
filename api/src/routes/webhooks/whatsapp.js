const express = require("express");
const router = express.Router();

/**
 * Verificação do webhook (Meta)
 * GET /api/webhooks/whatsapp/meta
 */
router.get("/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/**
 * Eventos do WhatsApp (mensagens, status etc.)
 * POST /api/webhooks/whatsapp/meta
 */
router.post(
  "/meta",
  express.json({ type: "*/*" }),
  (req, res) => {
    // IMPORTANTE: responder rápido
    res.sendStatus(200);

    try {
      console.log(
        "📩 WhatsApp webhook recebido:",
        JSON.stringify(req.body, null, 2)
      );
    } catch (err) {
      console.error("Erro ao processar webhook:", err);
    }
  }
);

module.exports = router;
