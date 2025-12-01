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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select.jsx";
import { base44 } from "@/apiClient/base44Client";
import { Upload, Image as ImageIcon, Video } from "lucide-react";

export default function Postformdialog({
  open,
  onClose,
  post,
  clients = [],
  onSubmit,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    clientId: "",
    status: "DRAFT",
    media_url: "",
    media_type: "image",
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        body: post.body || "",
        clientId: post.clientId || "",
        status: post.status || "DRAFT",
        media_url: post.media_url || "",
        media_type: post.media_type || "image",
      });
    } else {
      setFormData({
        title: "",
        body: "",
        clientId: "",
        status: "DRAFT",
        media_url: "",
        media_type: "image",
      });
    }
  }, [post]);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, media_url: file_url }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Falha ao enviar arquivo. Tente novamente.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post ? "Editar Post" : "Novo Post"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Título */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={handleChange("title")}
              placeholder="Título do post"
              required
            />
          </div>

          {/* Corpo */}
          <div className="space-y-2">
            <Label>Legenda / Corpo</Label>
            <Textarea
              value={formData.body}
              onChange={handleChange("body")}
              placeholder="Texto ou legenda do post"
              rows={4}
            />
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={formData.clientId}
              onValueChange={handleChange("clientId")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={handleChange("status")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="PENDING_APPROVAL">
                  Aguardando aprovação
                </SelectItem>
                <SelectItem value="APPROVED">Aprovado</SelectItem>
                <SelectItem value="SCHEDULED">Programado</SelectItem>
                <SelectItem value="PUBLISHED">Publicado</SelectItem>
                <SelectItem value="ARCHIVED">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload de mídia */}
          <div className="space-y-2">
            <Label>Mídia</Label>

            {formData.media_url && (
              <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {formData.media_type === "video" ? (
                  <Video className="w-16 h-16 text-gray-400" />
                ) : (
                  <img
                    src={formData.media_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
              />

              <Select
                value={formData.media_type}
                onValueChange={handleChange("media_type")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isSaving}
            >
              {isSaving
                ? "Salvando..."
                : post
                ? "Atualizar Post"
                : "Criar Post"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
