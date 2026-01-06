import React, { useState } from "react";
import { base44 } from "@/apiClient/base44Client";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Aicaptiongenerator({ post, client, onApply }) {
  const [generating, setGenerating] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateCaptions = async () => {
    setGenerating(true);
    try {
      const prompt = `Você é um especialista em social media. Gere variações de legenda para um post de ${
        client?.name || "marca"
      }.

Contexto:
- Título do post: ${post.title}
- Descrição atual: ${post.caption || "Não fornecida"}
- Setor: ${client?.sector || "Não especificado"}
- Tom: profissional e engajador

Para cada legenda, forneça:
1. A legenda completa (máximo 150 caracteres)
2. 3-5 hashtags relevantes
3. Um CTA (call-to-action)

Retorne no formato JSON exato:
{
  "captions": [
    {
      "text": "legenda aqui",
      "hashtags": ["#tag1", "#tag2"],
      "cta": "CTA aqui"
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            captions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  cta: { type: "string" },
                },
                required: ["text", "hashtags", "cta"],
              },
            },
          },
          required: ["captions"],
        },
      });

      const parsedCaptions = Array.isArray(result?.captions)
        ? result.captions
        : Array.isArray(result?.data?.captions)
        ? result.data.captions
        : [];

      if (!parsedCaptions.length) {
        throw new Error("Resposta da IA não contém legendas válidas.");
      }

      setCaptions(parsedCaptions);
      toast.success("Legendas geradas com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar legendas com IA:", error);
      toast.error(
        "Não foi possível gerar as legendas. Tente novamente em instantes."
      );
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (caption, index) => {
    try {
      const text = `${caption.text}\n\n${(caption.hashtags || []).join(
        " "
      )}\n\n${caption.cta}`;
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Legenda copiada para a área de transferência.");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Erro ao copiar legenda:", error);
      toast.error("Não foi possível copiar a legenda.");
    }
  };

  const previewPrompt = `Gere variações de legenda para um post de ${
    client?.name || "marca"
  } com base no título, descrição e contexto.`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">
                Gerador de legendas com IA
              </CardTitle>
              <p className="text-xs text-gray-500">
                Use a IA para criar variações de legenda a partir do contexto do
                post.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">
              Contexto enviado para a IA
            </Label>
            <Textarea
              value={previewPrompt}
              readOnly
              className="text-xs h-24 resize-none"
            />
          </div>

          {/* type="button" evita submit implícito quando este bloco é usado dentro do form de posts. */}
          <Button
            type="button"
            onClick={generateCaptions}
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando legendas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Legendas com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {captions.length > 0 && (
        <div className="space-y-3">
          {captions.map((caption, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Variação {index + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(caption, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onApply && onApply(caption)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Legenda</Label>
                  <p className="text-sm text-gray-900 mt-1">{caption.text}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hashtags</Label>
                  <p className="text-sm text-purple-600 mt-1">
                    {(caption.hashtags || []).join(" ")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">CTA</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {caption.cta}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
