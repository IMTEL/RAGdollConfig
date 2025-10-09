"use client";

import { AgentProvider } from "./agent_provider";

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AgentProvider>{children}</AgentProvider>;
}