"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { AgentProvider } from "./agent_provider";

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <AgentProvider>{children}</AgentProvider>
    </QueryClientProvider>
  );
}
