import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";
import { applyTenantTheme, deriveThemeColors } from "@/utils/theme";

export function useTenantTheme(options = {}) {
  const query = useQuery({
    queryKey: ["tenant-theme"],
    queryFn: () => base44.entities.Tenant.getCurrent(),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });

  const tenant = query.data || null;
  const theme = useMemo(() => deriveThemeColors(tenant || {}), [tenant]);

  useEffect(() => {
    if (!tenant) return;
    applyTenantTheme(tenant);
  }, [tenant]);

  return {
    ...query,
    tenant,
    theme,
  };
}
