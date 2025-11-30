export function createPageUrl(path = "") {
  if (!path) return "/";

  // Remove espaços e normaliza a URL
  const cleaned = String(path).trim().replace(/\s+/g, "-");

  return `/${cleaned}`;
}
