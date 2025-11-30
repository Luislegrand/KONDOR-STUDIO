import { Sidebar, SidebarContent, SidebarItem } from "@/components/ui/sidebar.jsx";
import { Outlet, Link } from "react-router-dom";
import { useState } from "react";

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen">

      {/* SIDEBAR */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarContent>

          <SidebarItem to="/dashboard" label="Dashboard" icon="grid" />
          <SidebarItem to="/clients" label="Clientes" icon="users" />
          <SidebarItem to="/posts" label="Posts" icon="file-text" />
          <SidebarItem to="/tasks" label="Tarefas" icon="check-circle" />
          <SidebarItem to="/biblioteca" label="Biblioteca" icon="book" />
          <SidebarItem to="/financeiro" label="Financeiro" icon="dollar-sign" />
          <SidebarItem to="/team" label="Equipe" icon="user-plus" />
          <SidebarItem to="/metrics" label="Métricas" icon="bar-chart" />
          <SidebarItem to="/integrations" label="Integrações" icon="plug" />
          <SidebarItem to="/settings" label="Configurações" icon="settings" />

        </SidebarContent>
      </Sidebar>

      {/* CONTEÚDO */}
      <main className="flex-1 bg-gray-100 p-10 overflow-auto">
        {children || <Outlet />}
      </main>

    </div>
  );
}
