// front/src/hooks/useImpersonation.js
import { useEffect, useState } from "react";

const STORAGE_KEY = "kondor_impersonation";

function readState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("[Impersonation] Falha ao ler storage", err);
    return null;
  }
}

function writeState(data) {
  if (typeof window === "undefined") return;
  try {
    if (!data) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    window.dispatchEvent(new Event("kondor_impersonation_update"));
  } catch (err) {
    console.error("[Impersonation] Falha ao salvar storage", err);
  }
}

export function setImpersonationState(payload) {
  writeState(payload || null);
}

export function clearImpersonationState() {
  writeState(null);
}

export function useImpersonationState() {
  const [state, setState] = useState(() => readState());

  useEffect(() => {
    const handleStorage = (event) => {
      if (event?.key && event.key !== STORAGE_KEY) return;
      setState(readState());
    };

    const handleCustom = () => setState(readState());

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      window.addEventListener("kondor_impersonation_update", handleCustom);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("kondor_impersonation_update", handleCustom);
      }
    };
  }, []);

  if (!state || !state.isImpersonating) return null;
  return state;
}

export function getImpersonationState() {
  return readState();
}
