import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react";
import Taskcard from "./taskcard.jsx";

const TASK_STATUS_ORDER = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
];

const TASK_STATUS_CONFIG = {
  TODO: {
    label: "Rascunho",
    description: "Ideias e tarefas ainda nao iniciadas.",
    icon: FileText,
    tone: "text-slate-500",
  },
  IN_PROGRESS: {
    label: "Em andamento",
    description: "Equipe atuando agora.",
    icon: Clock,
    tone: "text-sky-600",
  },
  REVIEW: {
    label: "Revisao",
    description: "Esperando validacao ou aprovacao.",
    icon: ShieldCheck,
    tone: "text-indigo-600",
  },
  DONE: {
    label: "Concluida",
    description: "Finalizadas e entregues.",
    icon: CheckCircle2,
    tone: "text-emerald-600",
  },
  BLOCKED: {
    label: "Bloqueada",
    description: "Aguardando dependencias ou impedimento.",
    icon: AlertTriangle,
    tone: "text-rose-600",
  },
};

function resolveTaskStatusConfig(status) {
  if (TASK_STATUS_CONFIG[status]) return TASK_STATUS_CONFIG[status];
  return {
    label: status || "Status",
    description: "Status personalizado",
    icon: FileText,
    tone: "text-slate-500",
  };
}

export default function Taskboard({
  tasks = [],
  clients = [],
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  collapsedColumns,
  onCollapsedChange,
  onCreate,
}) {
  const isControlled = collapsedColumns !== undefined;
  const [internalCollapsed, setInternalCollapsed] = React.useState(
    () => collapsedColumns || {}
  );

  React.useEffect(() => {
    if (!isControlled) return;
    setInternalCollapsed(collapsedColumns || {});
  }, [collapsedColumns, isControlled]);

  const collapsed = isControlled ? collapsedColumns || internalCollapsed : internalCollapsed;

  const clientMap = React.useMemo(() => {
    const map = new Map();
    (clients || []).forEach((client) => {
      if (client?.id) map.set(client.id, client);
    });
    return map;
  }, [clients]);

  const tasksByStatus = React.useMemo(() => {
    const grouped = {};
    TASK_STATUS_ORDER.forEach((status) => {
      grouped[status] = [];
    });
    (tasks || []).forEach((task) => {
      const status = task.status || "TODO";
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(task);
    });
    return grouped;
  }, [tasks]);

  const dynamicStatuses = React.useMemo(() => {
    const seen = new Set(TASK_STATUS_ORDER);
    return Array.from(
      new Set((tasks || []).map((task) => task.status).filter(Boolean))
    ).filter((status) => !seen.has(status));
  }, [tasks]);

  const orderedStatuses = React.useMemo(
    () => [...TASK_STATUS_ORDER, ...dynamicStatuses],
    [dynamicStatuses]
  );

  const toggleColumn = (key) => {
    const next = {
      ...collapsed,
      [key]: !collapsed?.[key],
    };
    setInternalCollapsed(next);
    if (onCollapsedChange) onCollapsedChange(next);
  };

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-[12px] bg-slate-100 animate-pulse" />
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
      <p>Nenhuma tarefa nesta etapa ainda.</p>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Crie uma tarefa para dar sequencia ao fluxo.
      </p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-3 inline-flex items-center justify-center rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-[11px] font-semibold text-[var(--text)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
        >
          Criar nova tarefa
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex w-full gap-4 overflow-x-auto pb-3">
        {orderedStatuses.map((status) => {
          const config = resolveTaskStatusConfig(status);
          const Icon = config.icon;
          const isCollapsed = Boolean(collapsed?.[status]);
          const items = tasksByStatus[status] || [];

          return (
            <section
              key={status}
              className={`flex-shrink-0 transition-[width] duration-200 ease-out ${
                isCollapsed ? "w-[72px]" : "w-[340px]"
              }`}
            >
              <div className="flex h-full flex-col rounded-[16px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
                <header
                  className={`flex items-start justify-between gap-2 ${
                    isCollapsed ? "flex-col" : ""
                  }`}
                >
                  <div className={`flex items-start gap-2 ${isCollapsed ? "flex-col" : ""}`}>
                    {Icon ? (
                      <Icon className={`h-5 w-5 ${config.tone || "text-slate-500"}`} />
                    ) : null}
                    {!isCollapsed ? (
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">
                          {config.label}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {config.description}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : ""}`}>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--text)]">
                      {items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleColumn(status)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                      aria-label={isCollapsed ? "Expandir coluna" : "Recolher coluna"}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </header>

                {!isCollapsed ? (
                  <div
                    className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1"
                    style={{ maxHeight: "calc(100vh - 280px)" }}
                  >
                    {isLoading
                      ? renderSkeleton()
                      : items.length === 0
                      ? renderEmpty()
                      : items.map((task) => (
                          <Taskcard
                            key={task.id}
                            task={task}
                            client={clientMap.get(task.clientId)}
                            onEdit={onEdit}
                            onStatusChange={onStatusChange}
                          />
                        ))}
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
