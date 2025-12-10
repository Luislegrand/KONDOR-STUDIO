import { base44 } from "@/apiClient/base44Client";

function getPreferredProtocol() {
  if (typeof window !== "undefined" && window.location?.protocol) {
    return window.location.protocol;
  }

  const envBase =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL) ||
    base44.API_BASE_URL ||
    "";

  if (envBase) {
    try {
      const parsed = new URL(envBase);
      if (parsed.protocol) {
        return parsed.protocol;
      }
    } catch (_) {}
  }

  return null;
}

function enforceProtocol(url) {
  if (!/^https?:\/\//i.test(url)) return url;
  const preferred = getPreferredProtocol();
  if (!preferred) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== preferred) {
      parsed.protocol = preferred;
      return parsed.toString();
    }
  } catch (_) {}

  return url;
}

export function resolveMediaUrl(raw) {
  if (!raw) return "";
  if (raw.startsWith("blob:") || /^https?:\/\//i.test(raw)) {
    return enforceProtocol(raw);
  }

  const base =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL) ||
    base44.API_BASE_URL ||
    "";
  const normalizedBase = base.replace(/\/$/, "");
  const suffix = raw.startsWith("/") ? raw : `/${raw}`;
  const url = normalizedBase ? `${normalizedBase}${suffix}` : raw;

  return enforceProtocol(url);
}
