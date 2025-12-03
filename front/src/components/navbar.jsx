import React from "react";
import { base44 } from "../base44Client";

export default function Navbar({ tenant, onLogout, client = false }) {
  const handleLogout = () => {
    if (client) {
      // logout do cliente
      try {
        window.localStorage.removeItem("kondor_client_auth");
      } catch (_) {}
      window.location.href = "/clientlogin";
      return;
    }

    // logout da agência
    base44.auth.logout();
    window.location.href = "/login";
  };

  return (
    <header
      style={{
        background: "var(--primary)",
        color: "#fff",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {tenant?.logo_url ? (
          <img
            src={tenant.logo_url}
            alt="Logo"
            className="nav-logo"
            style={{ height: "40px", objectFit: "contain" }}
          />
        ) : (
          <h2 style={{ margin: 0, fontWeight: 600 }}>KONDOR</h2>
        )}

        {tenant?.name && (
          <span style={{ opacity: 0.9, fontSize: "0.9rem" }}>{tenant.name}</span>
        )}
      </div>

      <button
        className="btn"
        style={{
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.25)",
          padding: "0.45rem 0.9rem",
        }}
        onClick={handleLogout}
      >
        Sair
      </button>
    </header>
  );
}
