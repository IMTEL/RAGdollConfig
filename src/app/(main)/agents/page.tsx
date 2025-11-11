"use client";
import { Bot, Plus, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentModal } from "@/components/agent-configuration/create-agent-modal";
import { DeleteAgent } from "@/components/agent-configuration/delete-agent-button";
import { TestAgent } from "@/components/agent-configuration/test-agent-button";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentUIState, defaultAgent } from "./agent_data";
import { useAgents, useAgentActions } from "./agent_provider";

interface AgentCardProps {
  agent: AgentUIState;
}

function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter();
  const { setAgents } = useAgentActions();

  return (
    <div className="group hover:bg-accent/50 relative rounded-lg border p-6 pb-12 transition-colors">
      <Link href={`/agents/${agent.id}`} className="block space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="text-muted-foreground h-5 w-5" />
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
        <div className="text-muted-foreground text-sm">
          Last updated {agent.lastUpdated}
        </div>
      </Link>
      <div className="absolute right-4 bottom-4 flex items-center gap-2">
        <TestAgent
          agent={agent}
          size="icon"
          variant="ghost"
          className="bg-transparent transition-colors hover:bg-blue-500 hover:text-white"
          label={null}
          icon={<MessageSquare className="h-4 w-4" />}
          ariaLabel="Open chat"
        />
        <DeleteAgent
          agent={agent}
          onSuccess={() => {
            setAgents((prev) => prev.filter((a) => a.id !== agent.id));
          }}
        />
      </div>
    </div>
  );
}

function AgentCardSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
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
        <Button onClick={() => setModalOpen(true)} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Create New Agent
        </Button>
      </div>
      <AgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(agent) => {
          setAgents((prevAgents) => [...prevAgents, agent]);
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
          state.map((agent) => <AgentCard key={agent.id} agent={agent} />)
        ) : (
          // Show empty state when no agents exist
          <div className="py-12 text-center">
            <Bot className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No agents yet</h3>
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
