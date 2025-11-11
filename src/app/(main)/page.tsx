import { Bot, Database, Key, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function Home() {
  const features = [
    {
      title: "Agents",
      description: "Create and manage AI agents with custom configurations",
      icon: Bot,
      href: "/agents",
      color: "text-blue-500",
    },
    {
      title: "API Keys",
      description:
        "Manage API keys for access to LLM models and other services",
      icon: Key,
      href: "/api-keys",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to RAGdoll Config
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          Manage your AI agents, knowledge bases, and API access all in one
          place. Get started by exploring the features below.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.href}>
            <div className="group hover:bg-accent/50 hover:border-primary/20 space-y-4 rounded-lg border p-6 transition-all duration-200">
              <div className="space-y-2">
                <div
                  className={`bg-accent inline-flex rounded-lg p-2 ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
              <div className="text-primary flex items-center text-sm font-medium transition-transform group-hover:translate-x-1">
                Get started
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
