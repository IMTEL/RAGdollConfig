"use client";

import { AgentUIState } from "@/app/(main)/agents/agent_data";
import axios from "axios";
import { Bot } from "lucide-react";
import { ComponentProps, ReactNode } from "react";
import { Button } from "../ui/button";
import { AccessKey } from "./access-key-card";

const CHAT_WEBSITE_URL =
  process.env.NEXT_PUBLIC_CHAT_WEBSITE_URL || "http://localhost:3001";

interface TestAgentProps {
  agent: AgentUIState;
  label?: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  icon?: ReactNode;
  ariaLabel?: string;
}

export function TestAgent({
  agent,
  label,
  variant = "outline",
  size,
  className,
  icon,
  ariaLabel,
}: TestAgentProps) {
  const getChatAccessKey = async (): Promise<AccessKey> => {
    const response = await axios.get("/api/chat-access-key", {
      params: { agentId: agent.id },
    });

    if (response.status !== 200) {
      console.error("Failed to get chat access key:", response.statusText);
      throw new Error("Failed to get chat access key");
    }

    return response.data as AccessKey;
  };

  const handleTestAgent = async () => {
    try {
      const accessKey = await getChatAccessKey();
      if (!accessKey.key) throw Error("No key in access-key");
      const params = new URLSearchParams({ key: accessKey.key });
      const chatUrl = `${CHAT_WEBSITE_URL}/${agent.databaseId}?${params.toString()}`;
      window.open(chatUrl, "_blank");
    } catch (error) {
      console.error("Error launching chat:", error);
      alert("Failed to launch chat interface. Please try again.");
    }
  };

  const resolvedLabel = label === undefined ? "Talk to Agent" : label;
  const iconElement = icon ?? <Bot className="h-4 w-4" />;
  const computedAriaLabel =
    ariaLabel ||
    (typeof resolvedLabel === "string" && resolvedLabel
      ? resolvedLabel
      : "Talk to Agent");

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      aria-label={computedAriaLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleTestAgent();
      }}
    >
      <span className={resolvedLabel ? "mr-2" : undefined}>{iconElement}</span>
      {resolvedLabel}
    </Button>
  );
}
