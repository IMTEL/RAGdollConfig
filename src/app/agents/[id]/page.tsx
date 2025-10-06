"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Save, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { use } from "react";
import { LLM, SelectModel } from "@/components/agent-configuration/select-model";
import { AgentBasePrompt } from "@/components/agent-configuration/agent-base-prompt";

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: LLM | null;
  status: "active" | "inactive";
  enableMemory: boolean;
  enableWebSearch: boolean;
  responseFormat: "text" | "structured";
  connectedCorpuses: string[];
}

interface Corpus {
  id: string;
  name: string;
  description: string;
  documents: number;
  status: "synced" | "outdated";
}

export default function AgentConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // Mock data for demonstration
  const [agent, setAgent] = useState<Agent>({
    id: id,
    name: "Customer Support Agent",
    description: "Handles customer inquiries and support requests",
    systemPrompt:
      "You are a helpful customer support agent. Always be polite and professional. If you don't know something, offer to escalate to a human agent.",
    temperature: 0.7,
    maxTokens: 1000,
    model: null,
    status: "active",
    enableMemory: true,
    enableWebSearch: false,
    responseFormat: "text",
    connectedCorpuses: ["corpus-1", "corpus-3"],
  });

  // Mock available corpuses
  const availableCorpuses: Corpus[] = [
    {
      id: "corpus-1",
      name: "Customer Support KB",
      description: "Customer support knowledge base and FAQs",
      documents: 150,
      status: "synced",
    },
    {
      id: "corpus-2",
      name: "Product Documentation",
      description: "Technical product documentation and guides",
      documents: 89,
      status: "synced",
    },
    {
      id: "corpus-3",
      name: "Company Policies",
      description: "Internal company policies and procedures",
      documents: 45,
      status: "outdated",
    },
    {
      id: "corpus-4",
      name: "Training Materials",
      description: "Employee training materials and resources",
      documents: 120,
      status: "synced",
    },
  ];

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

  const handleInputChange = (
    field: keyof Agent,
    value: string | number | boolean | LLM | null
  ) => {
    setAgent((prev) => ({ ...prev, [field]: value }));
  };

  const handleCorpusConnection = (corpusId: string, connected: boolean) => {
    if (connected) {
      setAgent((prev) => ({
        ...prev,
        connectedCorpuses: [...prev.connectedCorpuses, corpusId],
      }));
    } else {
      setAgent((prev) => ({
        ...prev,
        connectedCorpuses: prev.connectedCorpuses.filter(
          (id) => id !== corpusId
        ),
      }));
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving agent:", agent);
    // Temporary alert for demonstration
    alert("Agent configuration saved! (This is placeholder functionality)");
  };

  const handleTestAgent = () => {
    // Log the attempt
    console.log('Testing agent:', agent.name, 'with ID:', agent.id);

    try {
      const params = new URLSearchParams({
        agent: agent.id.toString(),
        name: agent.name
      });
      
     // const chatUrl = `/chat?${params.toString()}`;
     const chatUrl = `http://localhost:3000?agent=${agent.id}`;

      console.log('Opening chat URL:', chatUrl);
      window.open(chatUrl, '_blank');
    } catch (error) {
      console.error('Error launching chat:', error);
      // You might want to show an error message to the user
      alert('Failed to launch chat interface. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
            <p className="text-muted-foreground">
              Configure your agent&apos;s behavior and connections
            </p>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestAgent}
          >
            <Bot className="mr-2 h-4 w-4" />
            Test Agent
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic settings for your agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={agent.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={agent.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe what this agent does"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <AgentBasePrompt
                prompt={agent.systemPrompt}
                onChange={(prompt) => {handleInputChange("systemPrompt",prompt)} }
                maxLength={1000}
                />
              </div>  
            </CardContent>
          </Card>

          {/* Connected Corpuses */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Knowledge Bases</CardTitle>
              <CardDescription>
                Select which corpuses this agent can access for information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableCorpuses.map((corpus) => {
                  const isConnected = agent.connectedCorpuses.includes(
                    corpus.id
                  );
                  return (
                    <div
                      key={corpus.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        id={corpus.id}
                        checked={isConnected}
                        onCheckedChange={(checked : any) =>
                          handleCorpusConnection(corpus.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor={corpus.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {corpus.name}
                          </Label>
                          <Badge
                            variant={
                              corpus.status === "synced"
                                ? "default"
                                : "destructive"
                            }
                            className="ml-auto"
                          >
                            {corpus.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {corpus.description} • {corpus.documents} documents
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="status">Active</Label>
                <Switch
                  id="status"
                  checked={agent.status === "active"}
                  onCheckedChange={(checked : any) =>
                    handleInputChange("status", checked ? "active" : "inactive")
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memory">Reference</Label>
                  <p className="text-xs text-muted-foreground">
                    Reference material in the corpus
                  </p>
                </div>
                <Switch
                  id="memory"
                  checked={agent.enableMemory}
                  onCheckedChange={(checked : any) =>
                    handleInputChange("enableMemory", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="web-search">Web Search</Label>
                  <p className="text-xs text-muted-foreground">
                    Search the web for information
                  </p>
                </div>
                <Switch
                  id="web-search"
                  checked={agent.enableWebSearch}
                  onCheckedChange={(checked : any) =>
                    handleInputChange("enableWebSearch", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Configure the AI model and generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <SelectModel
                models={models}
                selectedModel={agent.model}
                onChange={ (model) => {handleInputChange("model",model)}}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="temperature">
                  Temperature: {agent.temperature}
                </Label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={agent.temperature}
                  onChange={(e) =>
                    handleInputChange("temperature", parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value={agent.maxTokens}
                  onChange={(e) =>
                    handleInputChange("maxTokens", parseInt(e.target.value))
                  }
                  placeholder="Maximum response length"
                  min="1"
                  max="4000"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
