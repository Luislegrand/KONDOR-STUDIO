import React from "react";
import PageShell from "@/components/ui/page-shell.jsx";
import PageHeader from "@/components/ui/page-header.jsx";
import EmptyState from "@/components/ui/empty-state.jsx";
import { Button } from "@/components/ui/button.jsx";
import { FileText, Plus } from "lucide-react";

export default function Reports() {
  return (
    <PageShell>
      <PageHeader
        title="Relatorios"
        subtitle="Crie modelos para exportar resultados."
        actions={<Button leftIcon={Plus}>Novo relatorio</Button>}
      />
      <div className="mt-6">
        <EmptyState
          title="Nenhum relatorio criado"
          description="Crie um modelo para gerar relatorios automaticos."
          action={<Button leftIcon={Plus}>Criar modelo</Button>}
          icon={FileText}
        />
      </div>
    </PageShell>
  );
}
