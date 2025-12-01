import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Building2, Pencil, Trash2, User } from "lucide-react";

export default function ClientCard({ client, onEdit, onDelete }) {
  return (
    <Card className="hover:shadow-md transition-shadow border border-purple-100">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            {client.logo_url ? (
              <img
                src={client.logo_url}
                alt={client.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-purple-600" />
            )}
          </div>
          <CardTitle className="text-base font-semibold text-gray-900">
            {client.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-gray-700">
        {client.sector && (
          <p className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            {client.sector}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(client)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:bg-red-50 flex-1"
            onClick={() => onDelete(client.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}