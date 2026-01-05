import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/apiClient/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { FormGrid, FormHint, FormSection } from "@/components/ui/form.jsx";
import { ChevronDown } from "lucide-react";

const DEFAULT_PERMISSIONS = {
  clients: true,
  posts: true,
  approvals: true,
  tasks: true,
  metrics: false,
  team: false,
  settings: false,
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "traffic_manager", label: "Gestor de Tráfego" },
  { value: "designer", label: "Designer" },
  { value: "social_media", label: "Social Media" },
  { value: "copywriter", label: "Copywriter" },
  { value: "videomaker", label: "Videomaker" },
];

function DropdownChip({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`w-full h-11 px-4 rounded-[14px] border text-left text-sm font-medium flex items-center justify-between transition ${
          open
            ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
            : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--surface-muted)]"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{currentLabel}</span>
        <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-[14px] border border-[var(--border)] bg-white shadow-[var(--shadow-md)] py-2 animate-fade-in-up">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-4 py-2 text-sm font-medium transition ${
                option.value === value
                  ? "text-[var(--primary)] bg-[var(--primary-light)]"
                  : "text-[var(--text)] hover:bg-[var(--surface-muted)]"
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Teamformdialog({ open, onClose, member }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "social_media",
    permissions: { ...DEFAULT_PERMISSIONS },
    salary: "",
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        username: member.username || "",
        password: "",
        role: member.role || "social_media",
        permissions: {
          ...DEFAULT_PERMISSIONS,
          ...(member.permissions || {}),
        },
        salary:
          typeof member.salaryCents === "number"
            ? (member.salaryCents / 100).toString()
            : "",
      });
    } else if (open) {
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "social_media",
        permissions: { ...DEFAULT_PERMISSIONS },
        salary: "",
      });
    }
  }, [member, open]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (member) {
        return base44.entities.TeamMember.update(member.id, data);
      }
      return base44.entities.TeamMember.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const usernameValue = formData.username ? formData.username.trim() : "";
    const salaryValue =
      formData.salary !== undefined && formData.salary !== null
        ? formData.salary.toString().trim()
        : "";

    const payload = {
      name: formData.name,
      email: formData.email,
      username: usernameValue || null,
      role: formData.role,
      permissions: formData.permissions,
      salary: salaryValue || null,
    };
    if (formData.password) {
      payload.password = formData.password;
    }
    mutation.mutate(payload);
  };

  const togglePermission = (key) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {member ? "Editar Membro" : "Novo Membro"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Dados do membro" description="Identificacao e acesso.">
            <FormGrid>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Login do membro</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="ex: joaosilva"
                />
                <FormHint>
                  Caso deixe em branco, o e-mail sera usado como login.
                </FormHint>
              </div>
              <div className="space-y-2">
                <Label>{member ? "Atualizar senha" : "Senha de acesso"}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Defina uma senha segura"
                  required={!member}
                />
                {member ? (
                  <FormHint>Deixe vazio se nao quiser alterar a senha.</FormHint>
                ) : null}
              </div>
            </FormGrid>
          </FormSection>

          <FormSection title="Perfil e custos" description="Funcao e custos associados.">
            <FormGrid>
              <div className="space-y-2">
                <Label>Funcao</Label>
                <DropdownChip
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value })}
                  options={ROLE_OPTIONS}
                  placeholder="Selecione..."
                />
              </div>
              <div className="space-y-2">
                <Label>Salario mensal (opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="Ex: 3500.00"
                />
                <FormHint>
                  Ao informar, sera criado um custo automatico no financeiro.
                </FormHint>
              </div>
            </FormGrid>
          </FormSection>

          <FormSection title="Permissoes" description="Defina o acesso do membro.">
            <div className="space-y-2 bg-[var(--surface-muted)] p-4 rounded-[14px] border border-[var(--border)]">
              {Object.keys(formData.permissions).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={!!formData.permissions[key]}
                    onCheckedChange={() => togglePermission(key)}
                  />
                  <label
                    htmlFor={key}
                    className="text-sm capitalize cursor-pointer text-[var(--text)]"
                  >
                    {key.replace("_", " ")}
                  </label>
                </div>
              ))}
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Salvando..."
                : member
                ? "Atualizar"
                : "Adicionar Membro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
