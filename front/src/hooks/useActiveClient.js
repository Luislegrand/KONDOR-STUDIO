import { useEffect, useState } from "react";

const STORAGE_KEY = "kondor_active_client";

function readState() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch (err) {
    console.error("[ActiveClient] Falha ao ler storage", err);
    return "";
  }
}

function writeState(value) {
  if (typeof window === "undefined") return;
  try {
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
    window.dispatchEvent(new Event("kondor_active_client_update"));
  } catch (err) {
    console.error("[ActiveClient] Falha ao salvar storage", err);
  }
}

export function setActiveClientId(value) {
  writeState(value || "");
}

export function getActiveClientId() {
  return readState();
}

export function useActiveClient() {
  const [clientId, setClientId] = useState(() => readState());

  useEffect(() => {
    const handleStorage = (event) => {
      if (event?.key && event.key !== STORAGE_KEY) return;
      setClientId(readState());
    };
    const handleCustom = () => setClientId(readState());

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      window.addEventListener("kondor_active_client_update", handleCustom);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("kondor_active_client_update", handleCustom);
      }
    };
  }, []);

  const update = (value) => {
    writeState(value || "");
  };

  return [clientId, update];
}
