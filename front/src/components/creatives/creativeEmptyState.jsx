import React from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

export default function CreativeEmptyState({
  onAction,
  actionLabel = "Criar post com midia",
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 px-6 text-center flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <ImagePlus className="w-8 h-8 text-slate-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-slate-900">
          Nenhum criativo encontrado
        </h3>
        <p className="text-sm text-slate-500">
          Envie o primeiro asset para alimentar campanhas e posts.
        </p>
      </div>
      {onAction ? (
        <Button size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
