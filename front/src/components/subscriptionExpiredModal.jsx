import React from "react";
import { useNavigate } from "react-router-dom";

export default function SubscriptionExpiredModal() {
  const navigate = useNavigate();

  function handleGoToPlans() {
    // Página onde você vai mostrar os planos (pode ajustar a rota se for diferente)
    navigate("/planos");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white max-w-md w-full rounded-xl shadow-lg p-6 space-y-4 border border-purple-100">
        <h2 className="text-xl font-semibold text-gray-900">
          Assinatura expirada ou teste encerrado
        </h2>

        <p className="text-sm text-gray-700">
          Seu período de teste terminou ou sua assinatura foi suspensa.
          Para continuar usando o <span className="font-semibold">KONDOR STUDIO</span>,
          ative um dos planos disponíveis.
        </p>

        <button
          type="button"
          onClick={handleGoToPlans}
          className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
        >
          Ver planos e reativar acesso
        </button>
      </div>
    </div>
  );
}
