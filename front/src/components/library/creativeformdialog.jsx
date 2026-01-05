import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea.jsx";
import { FormGrid, FormHint, FormSection } from "@/components/ui/form.jsx";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";

import { Upload } from "lucide-react";

export default function Creativeformdialog({ open, onClose, clients }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    file_url: "",
    file_type: "image",
    client_id: "",
    tags: "",
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const tenants = await base44.entities.Tenant.list();
      const payload = {
        ...data,
        tenant_id: tenants[0].id,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : []
      };
      return base44.entities.Creative.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      onClose();
      setFormData({
        name: "",
        file_url: "",
        file_type: "image",
        client_id: "",
        tags: "",
        notes: ""
      });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await base44.uploads.uploadFile(file, { folder: "creatives" });
      setFormData(prev => ({
        ...prev,
        file_url: url,
        file_type: file.type.startsWith('video') ? 'video' : 'image',
        name: prev.name || file.name
      }));
    } catch (error) {
      console.error('Upload error:', error);
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Novo Criativo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Arquivo" description="Envie o criativo que sera usado nas pecas.">
            <div className="space-y-2">
              <Label>Upload de Arquivo *</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="creative-upload"
                />
                <label htmlFor="creative-upload">
                  <Button type="button" variant="outline" className="w-full bg-white" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : formData.file_url ? "Arquivo enviado ✓" : "Upload de Arquivo"}
                    </span>
                  </Button>
                </label>
                <FormHint>PNG, JPG ou MP4. Recomendado até 50MB.</FormHint>
              </div>
            </div>
          </FormSection>

          <FormSection title="Detalhes" description="Organize o criativo por cliente e tags.">
            <FormGrid>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({...formData, client_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Tags (separadas por virgula)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="ex: feed, story, produto"
                />
              </div>
            </FormGrid>

            <div className="mt-4 space-y-2">
              <Label>Observacoes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={mutation.isPending || uploading || !formData.file_url}
            >
              {mutation.isPending ? 'Salvando...' : 'Criar Criativo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
