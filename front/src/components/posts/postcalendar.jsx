import React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getWorkflowStatusConfig, resolveWorkflowStatus } from "@/utils/postStatus.js";

const WEEK_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function toDateKey(date) {
  return date.toLocaleDateString("en-CA");
}

function formatMonthLabel(date) {
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildMonthGrid(current) {
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - firstWeekday);

  const weeks = [];
  let cursor = new Date(startDate);

  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}

export default function Postcalendar({
  posts = [],
  onPostClick,
  onDateClick,
  isLoading = false,
}) {
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const todayKey = React.useMemo(() => toDateKey(new Date()), []);

  const weeks = React.useMemo(() => buildMonthGrid(currentDate), [currentDate]);

  const postsByDate = React.useMemo(() => {
    const map = new Map();
    (posts || []).forEach((post) => {
      const rawSlots =
        post?.metadata?.scheduleSlots ||
        post?.metadata?.schedule_slots ||
        [];
      const scheduleSlots = Array.isArray(rawSlots)
        ? rawSlots.filter((slot) => slot && slot.date)
        : [];

      if (scheduleSlots.length > 0) {
        scheduleSlots.forEach((slot, index) => {
          const date = new Date(`${slot.date}T00:00:00`);
          if (isNaN(date.getTime())) return;
          const key = toDateKey(date);
          if (!map.has(key)) map.set(key, []);
          map.get(key).push({
            ...post,
            __slotId: `${post.id}-${index}`,
            __slotDate: slot.date,
            __slotTime: slot.time || null,
          });
        });
        return;
      }

      const dateValue =
        post.scheduledDate ||
        post.scheduledAt ||
        post.scheduled_at ||
        post.publishedDate ||
        post.published_at ||
        post.createdAt;
      if (!dateValue) return;
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return;
      const key = toDateKey(date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(post);
    });
    return map;
  }, [posts]);

  const goPrev = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNext = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (isLoading) {
    return (
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-36 rounded bg-slate-100 animate-pulse" />
            <div className="mt-2 h-3 w-28 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] border border-[var(--border)] bg-slate-100 animate-pulse" />
            <div className="h-9 w-9 rounded-[10px] border border-[var(--border)] bg-slate-100 animate-pulse" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="min-h-[120px] rounded-[12px] border border-[var(--border)] bg-slate-50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{formatMonthLabel(currentDate)}</p>
          <p className="text-xs text-[var(--text-muted)]">Calendario mensal</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--text-muted)] transition-[background-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-sm)]"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--text-muted)] transition-[background-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-sm)]"
            aria-label="Proximo mes"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="px-2">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {weeks.flat().map((day) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const key = toDateKey(day);
          const dayPosts = postsByDate.get(key) || [];
          const isToday = key === todayKey;

          const handleDateClick = () => {
            if (onDateClick) onDateClick(day);
          };

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={handleDateClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleDateClick();
                }
              }}
              aria-label={`Criar post em ${day.toLocaleDateString("pt-BR")}`}
              className={`group min-h-[120px] rounded-[12px] border border-[var(--border)] p-2 text-xs transition-[border-color,box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:border-[var(--primary)] hover:shadow-[var(--shadow-sm)] ${
                isCurrentMonth ? "bg-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
              } ${isToday ? "border-[var(--primary)] bg-[var(--primary-light)]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-[11px] font-semibold ${isCurrentMonth ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
                  {day.getDate()}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDateClick();
                  }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-white/80"
                  aria-label="Criar post"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {dayPosts.slice(0, 3).map((post) => {
                  const status = resolveWorkflowStatus(post);
                  const config = getWorkflowStatusConfig(status);
                  return (
                    <button
                      key={post.__slotId || post.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (onPostClick) onPostClick(post);
                      }}
                      className={`w-full truncate rounded-[8px] px-2 py-1 text-left text-[10px] ${config.badge}`}
                    >
                      {post.title || "Post sem titulo"}
                    </button>
                  );
                })}
                {dayPosts.length > 3 ? (
                  <div className="text-[10px] text-[var(--text-muted)]">+{dayPosts.length - 3} mais</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
