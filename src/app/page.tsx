import { Bot, Database, Key, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      title: "Corpuses",
      description:
        "Organize and manage your knowledge bases and document collections",
      icon: Database,
      href: "/corpuses",
      color: "text-green-500",
    },
    {
      title: "API Keys",
      description:
        "Generate and manage API keys for secure access to your resources",
      icon: Key,
      href: "/api-keys",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to RAGdoll Config
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Manage your AI agents, knowledge bases, and API access all in one
          place. Get started by exploring the features below.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.href}>
            <div className="group rounded-lg border p-6 space-y-4 hover:bg-accent/50 transition-all duration-200 hover:border-primary/20">
              <div className="space-y-2">
                <div
                  className={`inline-flex p-2 rounded-lg bg-accent ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
              <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
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
