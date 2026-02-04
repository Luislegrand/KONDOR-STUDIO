import React from "react";
import { deriveThemeColors } from "@/utils/theme.js";
import { normalizeThemeFront } from "./utils.js";

export default function ThemeProvider({
  theme,
  className = "",
  style,
  children,
}) {
  const normalizedTheme = React.useMemo(
    () => normalizeThemeFront(theme || {}),
    [theme]
  );
  const derived = React.useMemo(
    () =>
      deriveThemeColors({
        primary: normalizedTheme.brandColor,
        accent: normalizedTheme.accentColor,
      }),
    [normalizedTheme.accentColor, normalizedTheme.brandColor]
  );

  return (
    <div
      className={className}
      style={{
        "--bg": normalizedTheme.bg,
        "--card": normalizedTheme.cardBg,
        "--text": normalizedTheme.text,
        "--muted": normalizedTheme.mutedText,
        "--border": normalizedTheme.border,
        "--primary": derived.primary,
        "--accent": derived.accent,
        "--danger": "#EF4444",
        "--radius": `${normalizedTheme.radius}px`,
        "--background": normalizedTheme.bg,
        "--surface": normalizedTheme.cardBg,
        "--surface-muted": "#F8FAFC",
        "--text-muted": normalizedTheme.mutedText,
        "--primary-dark": derived.primaryDark,
        "--primary-light": derived.primaryLight,
        "--shadow-sm": "0 2px 6px rgba(15, 23, 42, 0.08)",
        "--shadow-md": "0 18px 32px rgba(15, 23, 42, 0.12)",
        "--radius-card": `${normalizedTheme.radius}px`,
        "--radius-button": `${normalizedTheme.radius}px`,
        "--radius-input": `${Math.max(0, normalizedTheme.radius - 4)}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
