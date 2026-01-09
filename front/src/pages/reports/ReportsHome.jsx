import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import PageShell from "@/components/ui/page-shell.jsx";
import EmptyState from "@/components/ui/empty-state.jsx";
import { Button } from "@/components/ui/button.jsx";
import ReportsIntro from "@/components/reports/ReportsIntro.jsx";

export default function ReportsHome() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="space-y-8">
        <ReportsIntro />
        <EmptyState
          icon={BarChart3}
          title="Modulo de relatorios em construcao"
          description="Estamos preparando o builder e a camada de dados. Enquanto isso, valide suas integracoes e clientes."
          action={
            <Button variant="secondary" onClick={() => navigate("/integrations")}>
              Ver integracoes
            </Button>
          }
        />
      </div>
    </PageShell>
  );
}
