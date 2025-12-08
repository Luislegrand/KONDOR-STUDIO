import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Pencil, CalendarDays, ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "TODO", label: "Rascunho" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "REVIEW", label: "Revisão" },
  { value: "DONE", label: "Concluída" },
  { value: "BLOCKED", label: "Bloqueada" },
];

const STATUS_STYLES = {
  TODO: { bar: "#c4b5fd", badge: "bg-purple-50 text-purple-700" },
  IN_PROGRESS: { bar: "#a78bfa", badge: "bg-indigo-50 text-indigo-700" },
  REVIEW: { bar: "#fcd34d", badge: "bg-amber-50 text-amber-700" },
  DONE: { bar: "#34d399", badge: "bg-emerald-50 text-emerald-700" },
  BLOCKED: { bar: "#fb7185", badge: "bg-rose-50 text-rose-700" },
};

function formatStatusLabel(value) {
  const found = STATUS_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value;
}

function formatDate(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function Taskcard({
  task,
  client,
  onEdit,
  onStatusChange,
}) {
  const dueLabel = formatDate(task.dueDate);
  const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.TODO;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleStatusChange = (value) => {
    if (!onStatusChange) return;
    onStatusChange(task.id, value);
    setMenuOpen(false);
  };

  return (
    <Card className="relative overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_10px_30px_-22px_rgba(109,40,217,0.8)]">
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: statusStyle.bar }}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900 line-clamp-2">
              {task.title || "Tarefa sem título"}
            </CardTitle>
            {client && (
              <p className="text-xs text-gray-500 mt-1">{client.name}</p>
            )}
          </div>
          <Badge
            className={`text-[10px] border border-transparent ${statusStyle.badge}`}
          >
            {formatStatusLabel(task.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        {task.description ? (
          <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-3">
            {task.description}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Sem descrição</p>
        )}

        {dueLabel && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-[11px] text-gray-500">
            <CalendarDays className="w-3.5 h-3.5" />
            Prazo {dueLabel}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 flex flex-col gap-3">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span>Status</span>
            <ChevronDown className="w-4 h-4 text-purple-400" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-100 bg-white shadow-2xl z-20">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-purple-50 ${
                    task.status === option.value
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-600"
                  }`}
                  onClick={() => handleStatusChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-xs font-semibold"
          onClick={() => onEdit && onEdit(task)}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}
