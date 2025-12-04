// front/src/components/navbar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { base44 } from "@/apiClient/base44Client";
import { useSubscription } from "./SubscriptionContext.jsx";
import SubscriptionExpiredModal from "./SubscriptionExpiredModal.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const { status, openModal, isModalOpen, closeModal } = useSubscription();

  async function handleLogout() {
    try {
      await base44.auth.logout();
    } catch (err) {
      console.error("Erro ao fazer logout", err);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  const isBlocked =
    status?.status === "expired" || status?.status === "blocked";

  function handleUpgradeClick() {
    openModal();
  }

  return (
    <>
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo + nome */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-purple-500 to-violet-400 flex items-center justify-center text-xs font-bold text-white">
              KS
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-900">
                KONDOR STUDIO
              </span>
              <span className="text-[11px] text-gray-500">
                Painel da agência
              </span>
            </div>
          </div>

          {/* Navegação principal (desktop simples) */}
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                [
                  "px-2 py-1 rounded-md",
                  isActive
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                ].join(" ")
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/clients"
              className={({ isActive }) =>
                [
                  "px-2 py-1 rounded-md",
                  isActive
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                ].join(" ")
              }
            >
              Clientes
            </NavLink>
            <NavLink
              to="/posts"
              className={({ isActive }) =>
                [
                  "px-2 py-1 rounded-md",
                  isActive
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                ].join(" ")
              }
            >
              Posts
            </NavLink>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                [
                  "px-2 py-1 rounded-md",
                  isActive
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                ].join(" ")
              }
            >
              Tarefas
            </NavLink>
            <NavLink
              to="/team"
              className={({ isActive }) =>
                [
                  "px-2 py-1 rounded-md",
                  isActive
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                ].join(" ")
              }
            >
              Equipe
            </NavLink>
          </nav>

          {/* Ações à direita */}
          <div className="flex items-center gap-3">
            {isBlocked && (
              <button
                type="button"
                onClick={handleUpgradeClick}
                className="hidden sm:inline-flex items-center rounded-full border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition"
              >
                Plano expirado – Fazer upgrade
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Modal de assinatura/trial expirado */}
      <SubscriptionExpiredModal open={isModalOpen} onClose={closeModal} />
    </>
  );
}
