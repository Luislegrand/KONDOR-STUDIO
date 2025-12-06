// KONDOR STUDIO — CORS config (origens permitidas)

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
    ];

module.exports = allowedOrigins;
