import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { base44 } from "@/apiClient/base44Client";
import { Upload } from "lucide-react";

export default function Clientformdialog({ open, onClose, client, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    sector: "",
    notes: "",
    logo_url: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        sector: client.sector || "",
        notes: client.notes || "",
        logo_url: client.logo_url || "",
      });
    } else {
      setFormData({
        name: "",
        sector: "",
        notes: "",
        logo_url: "",
      });
    }
  }, [client]);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error("Erro no upload do logo:", error);
      alert("Falha ao enviar o logo. Tente novamente.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <Input
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="Nome da empresa / cliente"
              required
            />
          </div>

          {/* Setor */}
          <div className="space-y-2">
            <Label>Setor</Label>
            <Input
              value={formData.sector}
              onChange={handleChange("sector")}
              placeholder="Ex: Saúde, Construção, Moda..."
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas Internas</Label>
            <Textarea
              value={formData.notes}
              onChange={handleChange("notes")}
              placeholder="Adicione informações importantes sobre o cliente"
              rows={4}
            />
          </div>

          {/* Upload de Logo */}
          <div className="space-y-2">
            <Label>Logo do Cliente</Label>

            {formData.logo_url && (
              <img
                src={formData.logo_url}
                alt="Logo do cliente"
                className="w-20 h-20 object-contain rounded-lg border"
              />
            )}

            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={handleUpload} />
              <Upload className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {client ? "Salvar Alterações" : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
