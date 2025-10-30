import { Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  lastUpdated: string;
}

interface AgentCardProps {
  agent: Agent;
}

function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="rounded-lg border p-6 space-y-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{agent.name}</h3>
            <Badge
              variant={agent.status === "active" ? "default" : "secondary"}
            >
              {agent.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Configure
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Last updated {agent.lastUpdated}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  // Mock data for demonstration
  const agents: Agent[] = [
    {
      id: 1,
      name: "Customer Support Agent",
      description: "Handles customer inquiries and support requests",
      status: "active",
      lastUpdated: "2 hours ago",
    },
    {
      id: 2,
      name: "Sales Assistant",
      description: "Assists with sales inquiries and product information",
      status: "inactive",
      lastUpdated: "1 day ago",
    },
    {
      id: 3,
      name: "Technical Documentation Bot",
      description: "Helps users find technical documentation and guides",
      status: "active",
      lastUpdated: "30 minutes ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage your AI agents and their configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
