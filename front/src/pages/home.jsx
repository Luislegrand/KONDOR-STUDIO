import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  ArrowRight,
  BarChart3,
  Check,
  DollarSign,
  LayoutDashboard,
  PlayCircle,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { pricingPlans } from "@/data/pricingPlans.js";

const navLinks = [
  { href: "#features", label: "Funcionalidades" },
  { href: "#modules", label: "Módulos" },
  { href: "#video", label: "Demo" },
  { href: "#pricing", label: "Planos" },
];

const featureHighlights = [
  {
    icon: LayoutDashboard,
    title: "Operação completa",
    description:
      "Kanban de posts, tarefas, biblioteca de criativos, aprovações e métricas em um único lugar.",
  },
  {
    icon: Users,
    title: "Onboarding guiado",
    description:
      "Cadastre clientes com briefing completo, contratos, acessos e fluxo financeiro automático.",
  },
  {
    icon: Shield,
    title: "Portal para o cliente",
    description:
      "Envie posts para aprovação, compartilhe relatórios e reduza o número de reuniões e mensagens.",
  },
  {
    icon: BarChart3,
    title: "Insights acionáveis",
    description:
      "Dashboards e relatórios que mostram o que realmente importa para a sua agência e seus clientes.",
  },
];

const modules = [
  {
    title: "Clientes & Briefings",
    description:
      "Centralize informações estratégicas, contatos, acessos e contratos. Gere logins para o portal do cliente com um clique.",
  },
  {
    title: "Posts & Aprovações",
    description:
      "Planeje calendários, acompanhe status e mande aprovações por link ou WhatsApp.",
  },
  {
    title: "Tarefas & Projetos",
    description:
      "Quadros visuais para organizar o fluxo do time e garantir entregas dentro do prazo.",
  },
  {
    title: "Biblioteca de Criativos",
    description:
      "Tagueie imagens, vídeos e documentos para reutilizar assets rapidamente em novas campanhas.",
  },
  {
    title: "Métricas",
    description:
      "Conecte integrações e visualize performance por campanha, cliente e período.",
  },
  {
    title: "Financeiro",
    description:
      "Controle receitas recorrentes, despesas por cliente e tenha previsibilidade de caixa.",
  },
];

const iconMap = {
  sparkles: Sparkles,
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/40 to-white text-gray-900">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-semibold">
              K
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">KONDOR</p>
              <p className="text-xs text-purple-500 tracking-[0.2em]">
                STUDIO
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900">
              Preços
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => navigate("/login")}
            >
              Entrar
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-purple-500 to-purple-700"
            >
              Começar teste
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-sm font-medium text-purple-700 mb-6">
              <Sparkles className="w-4 h-4" />
              Plataforma tudo-em-um para agências
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Organize clientes, posts, tarefas e finanças sem sair do mesmo
              painel.
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              O Kondor Studio centraliza o que sua agência precisa para vender,
              produzir e entregar campanhas com previsibilidade.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-purple-700"
                onClick={() => navigate("/register")}
              >
                Fazer teste gratuito
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/checkout")}
                className="border-purple-300 text-purple-600"
              >
                Ir para o checkout
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              3 dias grátis, sem cartão. Cancelamento em 1 clique.
            </p>
          </div>

          <Card className="bg-white/80 shadow-xl border-purple-100">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Visão geral do painel
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Status de clientes, posts e tarefas em tempo real.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Alertas de aprovação e renovação financeira.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Widgets configuráveis por time e por cliente.
                </li>
              </ul>
              <div className="rounded-lg border border-dashed border-purple-200 p-4 text-sm text-gray-500">
                Mostramos apenas dados fictícios nesta prévia, mas o dashboard
                real se conecta às integrações e ao seu CRM em segundos.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-6 py-16 grid gap-6 md:grid-cols-2"
      >
        {featureHighlights.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="border border-purple-100 hover:border-purple-200 transition-colors"
            >
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-semibold">{feature.title}</p>
                <p className="text-sm text-gray-600">{feature.description}</p>
                <span className="text-xs font-medium uppercase tracking-wide text-purple-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Modules */}
      <section
        id="modules"
        className="max-w-6xl mx-auto px-6 py-16 space-y-8"
      >
        <div>
          <p className="text-sm text-purple-600 font-semibold mb-2">
            Tudo conectado
          </p>
          <h2 className="text-3xl font-bold">
            Modules para cada etapa da operação
          </h2>
          <p className="text-gray-600 max-w-3xl mt-2">
            O Kondor Studio foi pensado para o fluxo de agências: do briefing,
            passando por produção de conteúdo até a entrega de relatórios e
            gestão financeira.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((module) => (
            <Card
              key={module.title}
              className="border border-gray-100 shadow-sm"
            >
              <CardContent className="p-5 space-y-2">
                <p className="font-semibold text-lg">{module.title}</p>
                <p className="text-sm text-gray-600">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Video */}
      <section
        id="video"
        className="max-w-5xl mx-auto px-6 py-16 grid gap-8 md:grid-cols-2 items-center"
      >
        <div>
          <p className="text-sm text-purple-600 font-semibold mb-2">
            Veja como funciona
          </p>
          <h2 className="text-3xl font-bold mb-4">
            Um tour rápido pelo Kondor Studio
          </h2>
          <p className="text-gray-600 mb-4">
            Assista ao walkthrough de 2 minutos mostrando como incluir um
            cliente, planejar posts e enviar aprovações.
          </p>
          <Button
            variant="outline"
            className="border-purple-300 text-purple-700"
            onClick={() => document.getElementById("pricing")?.scrollIntoView()}
          >
            Quero usar agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-purple-100">
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-semibold text-lg">
            <PlayCircle className="w-10 h-10 mr-2" />
            Vídeo explicativo
          </div>
          <iframe
            title="Demonstração Kondor Studio"
            className="w-full h-64 md:h-80"
            src="https://www.youtube-nocookie.com/embed/poY7h1dMQUA"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* Pricing summary */}
      <section
        id="pricing"
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <div className="text-center mb-10 space-y-3">
          <p className="text-sm text-purple-600 font-semibold">Planos</p>
          <h2 className="text-3xl font-bold">
            Escolha o plano ideal e faça upgrade quando quiser
          </h2>
          <p className="text-gray-600">
            Todos os planos incluem portal do cliente, aprovações, biblioteca e
            suporte humano.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => {
            const Icon =
              (plan.icon && iconMap[plan.icon]) || DollarSign;
            return (
              <Card
                key={plan.id}
                className={`border ${
                  plan.popular ? "border-purple-400 shadow-lg" : "border-gray-100"
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                        plan.color
                      } text-white flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-xs text-gray-500">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                  <p className="text-4xl font-bold">
                    {formatCurrency(plan.price)}
                    <span className="text-base text-gray-500">/mês</span>
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-700"
                    onClick={() => navigate("/checkout", { state: { plan: plan.id } })}
                  >
                    Assinar {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Precisa de um plano personalizado? Fale com a gente.
          </p>
          <Button variant="outline" onClick={() => navigate("/pricing")}>
            Ver todos os detalhes dos planos
          </Button>
        </div>
      </section>

      <section className="bg-purple-600 text-white text-center py-16 px-6">
        <p className="text-sm uppercase tracking-[0.3em] text-purple-200 mb-3">
          Pronto para começar?
        </p>
        <h2 className="text-3xl font-bold mb-4">
          Ative o teste gratuito e entregue a próxima campanha com confiança.
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="bg-white text-purple-700 hover:bg-white/90"
          >
            Criar minha conta
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white"
            onClick={() => navigate("/login")}
          >
            Já sou cliente
          </Button>
        </div>
      </section>

      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm flex flex-col md:flex-row justify-between items-center gap-3">
          <span>© {new Date().getFullYear()} Kondor Studio</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-white transition-colors">
              Criar conta
            </Link>
            <Link to="/pricing" className="hover:text-white transition-colors">
              Planos
            </Link>
            <Link to="/checkout" className="hover:text-white transition-colors">
              Checkout
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
