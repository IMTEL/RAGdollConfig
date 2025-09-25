"use client"
import { AgentBasePrompt } from "@/components/agent-configuration/agent-base-prompt";
import { LLM, SelectModel } from "@/components/agent-configuration/select-model";
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";




export default function ConfigureAgent() {

  const [model, setModel] = useState<LLM | null>(null);
  const [basePrompt, setBasePrompt] = useState<string | null>(null);

  const onSelectModel = (model: LLM | null) => {
    console.log("changing model")
    setModel(model)
  }

  const searchParams = useSearchParams();
  const [agentId, setAgentId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("agentId");
    setAgentId(id);
    // TODO: fetch existing agent config by id and populate model/basePrompt
  }, [searchParams]);

  const onBasePromptChanged = (promt: string) => {

  }



  const models: LLM[] =
    [
      {
        id: 1,
        name: "Idun",
        description: "Sheesh",
        GDPRCompliant: true,
      },
      {
        id: 2,
        name: "ChatGPT5",
        description: "Sheesh",
        GDPRCompliant: false,
      },
      {
        id: 3,
        name: "DeepSeek",
        description: "Sheesh",
        GDPRCompliant: false,
      },
    ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configure agent</h1>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Configuring agent with ID: {agentId}
      </div>

      <Separator />
      <p className="text-muted-foreground">
        Agent Model
      </p>

      <SelectModel
        models={models}
        selectedModel={model}
        onChange={onSelectModel} />

      <Separator />
      <p className="text-muted-foreground">
        Base Prompt
      </p>
      <AgentBasePrompt
        prompt={basePrompt ?? ""}
        onChange={(prompt) => { setBasePrompt(prompt) }}
        maxLength={1000}
      />

    <Separator />
    </div>
  );
}
