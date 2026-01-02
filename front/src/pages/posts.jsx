import React, { useMemo, useState } from "react";
import { base44 } from "@/apiClient/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button.jsx";
import PageShell from "@/components/ui/page-shell.jsx";
import PageHeader from "@/components/ui/page-header.jsx";
import FilterBar from "@/components/ui/filter-bar.jsx";
import EmptyState from "@/components/ui/empty-state.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Plus } from "lucide-react";
import Postkanban from "../components/posts/postkanban.jsx";
import Postformdialog from "../components/posts/postformdialog.jsx";

export default function Posts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const queryClient = useQueryClient();

  const handleDialogClose = React.useCallback(() => {
    setDialogOpen(false);
    setEditingPost(null);
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => base44.entities.Integration.list(),
  });

  const invalidatePosts = () =>
    queryClient.invalidateQueries({ queryKey: ["posts"] });

  const showError = (error) => {
    const message =
      error?.data?.error ||
      error?.message ||
      "Erro ao salvar o post. Tente novamente.";
    alert(message);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create(data),
    onSuccess: () => {
      invalidatePosts();
      handleDialogClose();
    },
    onError: showError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Post.update(id, data),
    onSuccess: () => {
      invalidatePosts();
      handleDialogClose();
    },
    onError: showError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      invalidatePosts();
      handleDialogClose();
    },
    onError: showError,
  });

  const sendToApprovalMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.sendToApproval(id),
    onSuccess: () => {
      invalidatePosts();
    },
    onError: showError,
  });

  const handleEdit = (post) => {
    setEditingPost(post);
    setDialogOpen(true);
  };

  const handleStatusChange = (postId, newStatus) => {
    if (newStatus === "PENDING_APPROVAL") {
      sendToApprovalMutation.mutate(postId);
      return;
    }
    updateMutation.mutate({
      id: postId,
      data: { status: newStatus },
    });
  };

  const handleSubmit = (data) => {
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    sendToApprovalMutation.isPending;

  const filteredPosts = useMemo(() => {
    if (!selectedClientId) return [];
    const start = dateStart ? new Date(`${dateStart}T00:00:00`) : null;
    const end = dateEnd ? new Date(`${dateEnd}T23:59:59`) : null;

    return (posts || []).filter((post) => {
      if (post.clientId !== selectedClientId) return false;
      if (!start && !end) return true;

      const postDateValue = post.scheduledDate || post.createdAt;
      if (!postDateValue) return false;
      const postDate = new Date(postDateValue);
      if (start && postDate < start) return false;
      if (end && postDate > end) return false;
      return true;
    });
  }, [posts, selectedClientId, dateStart, dateEnd]);

  return (
    <PageShell>
      <PageHeader
        title="Posts"
        subtitle="Gerencie o fluxo de criacao e aprovacao."
        actions={
          <Button leftIcon={Plus} onClick={() => setDialogOpen(true)}>
            Novo post
          </Button>
        }
      />

      <FilterBar className="mt-6">
        <div className="min-w-[220px] flex-1">
          <Label>Cliente</Label>
          <select
            value={selectedClientId}
            onChange={(event) => setSelectedClientId(event.target.value)}
            className="w-full h-10 rounded-[10px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.2)]"
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {clients.length === 0 ? (
            <p className="text-[11px] text-amber-600 mt-1">
              Cadastre um cliente antes de visualizar posts.
            </p>
          ) : null}
        </div>

        <div className="min-w-[160px]">
          <Label>Data inicial</Label>
          <Input
            type="date"
            value={dateStart}
            onChange={(event) => setDateStart(event.target.value)}
            disabled={!selectedClientId}
          />
        </div>

        <div className="min-w-[160px]">
          <Label>Data final</Label>
          <Input
            type="date"
            value={dateEnd}
            onChange={(event) => setDateEnd(event.target.value)}
            disabled={!selectedClientId}
          />
        </div>
      </FilterBar>

      <div className="mt-6">
        {!selectedClientId ? (
          <EmptyState
            title="Selecione um cliente"
            description="Escolha um cliente para visualizar os posts."
          />
        ) : (
          <Postkanban
            posts={filteredPosts}
            clients={clients}
            integrations={integrations}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        )}
      </div>

      <Postformdialog
        open={dialogOpen}
        onClose={handleDialogClose}
        post={editingPost}
        clients={clients}
        integrations={integrations}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        onDelete={
          editingPost ? () => deleteMutation.mutate(editingPost.id) : undefined
        }
        isDeleting={deleteMutation.isPending}
      />
    </PageShell>
  );
}
