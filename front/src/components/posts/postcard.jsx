import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { ChevronDown } from "lucide-react";
import {
  getWorkflowStatuses,
  getWorkflowStatusConfig,
  resolveWorkflowStatus,
} from "@/utils/postStatus.js";

const STATUS_OPTIONS = getWorkflowStatuses();

function formatDate(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveNetworkLabel(post, integration) {
  const kind =
    integration?.settings?.kind ||
    post?.metadata?.integrationKind ||
    post?.metadata?.integration_kind ||
    null;

  if (kind === "meta_business") return "Meta Business";
  if (kind === "instagram_only") return "Instagram";
  if (kind === "tiktok") return "TikTok";

  const platform = post?.platform || null;
  if (platform === "instagram") return "Instagram";
  if (platform === "tiktok") return "TikTok";
  if (platform === "meta_business") return "Meta Business";

  if (integration?.providerName) return integration.providerName;
  if (integration?.provider) return integration.provider;

  const providerMeta =
    post?.metadata?.integrationProvider ||
    post?.metadata?.integration_provider ||
    null;
  if (providerMeta) return String(providerMeta);

  return null;
}

function resolvePostType(post) {
  const postKind =
    post?.postKind ||
    post?.post_kind ||
    post?.metadata?.postKind ||
    post?.metadata?.post_kind ||
    null;
  if (typeof postKind === "string") {
    const normalized = postKind.toLowerCase();
    if (normalized === "story") return "Story";
    if (normalized === "reel" || normalized === "reels") return "Reel";
    if (normalized === "feed") return "Feed";
  }

  const mediaType = post?.mediaType || post?.media_type;
  if (mediaType === "video") return "Video";
  if (mediaType === "carousel") return "Carrossel";
  return "Imagem";
}

export default function Postcard({ post, client, integration, onEdit, onStatusChange }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [localStatus, setLocalStatus] = React.useState(resolveWorkflowStatus(post));
  const triggerRef = React.useRef(null);
  const menuContentRef = React.useRef(null);
  const [menuPosition, setMenuPosition] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const clientFeedback = (post.clientFeedback || "").trim();
  const hasClientFeedback = Boolean(clientFeedback);
  const statusConfig = getWorkflowStatusConfig(localStatus);

  const updateMenuPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setLocalStatus(resolveWorkflowStatus(post));
  }, [post]);

  const handleStatusChange = (newStatus) => {
    if (!onStatusChange) return;
    onStatusChange(post.id, newStatus);
  };

  const scheduledLabel = formatDate(
    post.scheduledAt || post.scheduled_at || post.scheduledDate || post.publishedDate
  );
  const networkLabel = resolveNetworkLabel(post, integration);
  const description = post.body || post.caption;
  const typeLabel = resolvePostType(post);

  React.useEffect(() => {
    function handleClickOutside(event) {
      const triggerEl = triggerRef.current;
      const menuEl = menuContentRef.current;
      if (
        (triggerEl && triggerEl.contains(event.target)) ||
        (menuEl && menuEl.contains(event.target))
      ) {
        return;
      }
      setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [menuOpen, updateMenuPosition]);

  const triggerStatusMenu = (event) => {
    event.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const selectStatus = (event, value) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (value === localStatus) return;
    setLocalStatus(value);
    handleStatusChange(value);
  };

  return (
    <Card
      className="group relative w-full border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
      onClick={() => onEdit && onEdit(post)}
      role="button"
      tabIndex={0}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-[var(--text)] line-clamp-2">
              {post.title || "Post sem titulo"}
            </CardTitle>
            {client && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {client.name}
              </p>
            )}
          </div>
          <Badge className={`text-[10px] border border-transparent ${statusConfig.badge}`}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      {(description || hasClientFeedback) && (
        <CardContent className="pt-0 pb-2 space-y-3">
          {description && (
            <p className="text-xs text-[var(--text-muted)] line-clamp-2 whitespace-pre-line">
              {description}
            </p>
          )}
          {hasClientFeedback && (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Ajustes solicitados
              </p>
              <p className="text-xs text-amber-800 line-clamp-2 whitespace-pre-line">
                {clientFeedback}
              </p>
            </div>
          )}
        </CardContent>
      )}

      <CardContent className="pt-0 pb-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px]">
            {typeLabel}
          </Badge>
          {networkLabel ? (
            <Badge variant="outline" className="text-[10px]">
              {networkLabel}
            </Badge>
          ) : null}
          {scheduledLabel ? (
            <Badge variant="outline" className="text-[10px]">
              {scheduledLabel}
            </Badge>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between gap-2">
        <div className="relative w-full">
          <button
            type="button"
            onClick={triggerStatusMenu}
            ref={triggerRef}
            className="w-full inline-flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-muted)]"
          >
            <span>{statusConfig.label}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            onEdit && onEdit(post);
          }}
        >
          Detalhes
        </Button>
      </CardFooter>
      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuContentRef}
            className="fixed z-50 rounded-[12px] border border-[var(--border)] bg-white p-1 shadow-[var(--shadow-md)]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.width,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={(event) => selectStatus(event, opt.key)}
                className={`w-full rounded-[10px] px-3 py-2 text-left text-xs transition ${
                  opt.key === localStatus
                    ? "bg-[var(--primary-light)] text-[var(--primary)] font-semibold"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </Card>
  );
}
