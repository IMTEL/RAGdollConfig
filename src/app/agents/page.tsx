"use client";
import { Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentModal } from "@/components/ui/modal";
import { useState } from "react";
import Link from "next/link";
import { Agent, defaultAgent, initialState } from "./agent_data";
import { useAgents, useAgentActions } from "./agent_provider";

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
          <Link href={`/agents/${agent.id}`}>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </Link>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Last updated {agent.lastUpdated}
      </div>
    </div>
  );
}

function AgentsPageContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const { state } = useAgents();
  const { setAgents } = useAgentActions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage and configure your AI agents
          </p>
        </div>
        <Button 
          onClick={() => setModalOpen(true)} 
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Agent
        </Button>
      </div>
      <AgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(agent) => {
          setAgents((prevAgents) => [
            ...prevAgents,
            {
              ...defaultAgent(),
              id: (prevAgents.length + 1).toString(),
              name: agent.name,
              description: agent.description,
            } as Agent,
          ]);
          setModalOpen(false);
        }}
      />
      <div className="grid gap-4">
        {state.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return <AgentsPageContent />;
}
