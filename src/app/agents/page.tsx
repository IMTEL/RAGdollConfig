"use client";
import { Bot, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentModal } from "@/components/agent-configuration/create-agent-modal";
import { useState } from "react";
import Link from "next/link";
import { AgentUIState, defaultAgent } from "./agent_data";
import { useAgents, useAgentActions } from "./agent_provider";

interface AgentCardProps {
  agent: AgentUIState;
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

function AgentCardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function AgentsPageContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const { state, isLoading } = useAgents();
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
            ...prevAgents,agent
          ]);
          setModalOpen(false);
        }}
      />
      <div className="grid gap-4">
        {isLoading ? (
          // Show skeleton loading cards while data is being fetched
          Array.from({ length: 3 }).map((_, index) => (
            <AgentCardSkeleton key={index} />
          ))
        ) : state.length > 0 ? (
          // Show actual agent cards when data is loaded
          state.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        ) : (
          // Show empty state when no agents exist
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI agent to get started
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return <AgentsPageContent />;
}
