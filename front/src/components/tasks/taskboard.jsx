import React from "react";
import Taskcard from "./taskcard.jsx";

const BASE_COLUMNS = [
  {
    status: "TODO",
    title: "Rascunho",
    description: "Ideias e tarefas ainda não iniciadas.",
  },
  {
    status: "IN_PROGRESS",
    title: "Em andamento",
    description: "Equipe atuando agora.",
  },
  {
    status: "REVIEW",
    title: "Revisão",
    description: "Esperando validação ou aprovação.",
  },
  {
    status: "DONE",
    title: "Concluída",
    description: "Finalizadas e entregues.",
  },
  {
    status: "BLOCKED",
    title: "Bloqueada",
    description: "Aguardando dependências ou impedimento.",
  },
];

export default function Taskboard({
  tasks = [],
  clients = [],
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const clientMap = React.useMemo(() => {
    const map = new Map();
    (clients || []).forEach((client) => {
      if (client?.id) map.set(client.id, client);
    });
    return map;
  }, [clients]);

  const tasksByStatus = React.useMemo(() => {
    const grouped = new Map();
    (tasks || []).forEach((task) => {
      const bucket = grouped.get(task.status) || [];
      bucket.push(task);
      grouped.set(task.status, bucket);
    });
    return grouped;
  }, [tasks]);

  const getClient = (id) => {
    if (!id) return null;
    return clientMap.get(id) || null;
  };

  const allStatuses = Array.from(
    new Set(tasks.map((t) => t.status).filter(Boolean))
  );
  const dynamicColumns = allStatuses
    .filter((s) => !BASE_COLUMNS.find((col) => col.status === s))
    .map((s) => ({
      status: s,
      title: s,
      description: "Status personalizado",
    }));

  const columns = [...BASE_COLUMNS, ...dynamicColumns];

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 rounded-2xl bg-slate-100/80 animate-pulse"
        />
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-400">
      Nenhuma tarefa nesta coluna.
    </div>
  );

  return (
    <div className="pb-8">
      <div className="flex w-full gap-5 overflow-x-auto pb-2">
        {columns.map((col) => {
          const columnTasks = tasksByStatus.get(col.status) || [];

          return (
            <div key={col.status} className="min-w-[360px] flex-shrink-0">
              <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-100 backdrop-blur-md">
                <div className="sticky top-0 z-10 mb-4 flex items-start justify-between gap-3 bg-white/90 pb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {col.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {col.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {columnTasks.length}
                  </span>
                </div>

                <div
                  className="flex-1 space-y-4 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
                  style={{ maxHeight: "calc(100vh - 220px)" }}
                >
                  {isLoading
                    ? renderSkeleton()
                    : columnTasks.length === 0
                    ? renderEmpty()
                    : columnTasks.map((task) => (
                        <Taskcard
                          key={task.id}
                          task={task}
                          client={getClient(task.clientId)}
                          onEdit={onEdit}
                          onStatusChange={onStatusChange}
                        />
                      ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
