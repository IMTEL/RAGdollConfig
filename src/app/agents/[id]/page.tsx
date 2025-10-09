"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Save,
  Upload,
  FileText,
  Trash2,
  Calendar,
  Drama,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { use } from "react";
import {
  SelectModel,
} from "@/components/agent-configuration/select-model";
import { RoleEditor } from "@/components/agent-configuration/role-editor";
import { Agent, agentsClient, CorpusDocument, LLM } from "../agent_data";
import { useAgentActions, useAgents } from "../agent_provider";

export default function AgentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { state } = useAgents();
  const { setAgent, setDocuments } = useAgentActions();
  const router = useRouter();
  const { id } = use(params);

  const agent = state.find((agent) => agent.databaseId === id || agent.id === id);

  if (!agent) {
    return <div> Agent not found </div>;
  }

  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (
    field: keyof Agent,
    value: string | number | boolean | null
  ) => {
    setAgent(agent.id, (prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = useCallback((files: FileList) => {
    const newDocuments: CorpusDocument[] = Array.from(files).map((file, index) => ({
      id: `doc-${Date.now()}-${index}`,
      name: file.name,
      type: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split("T")[0],
      status: "processing" as const,
    }));

    setDocuments(agent.id, (prev) => [...prev, ...newDocuments]);

    // Simulate processing
    setTimeout(() => {
      setDocuments(agent.id, (prev) => 
        prev.map((doc) =>
          newDocuments.some((newDoc) => newDoc.id === doc.id)
            ? { ...doc, status: "ready" as const }
            : doc
        )
      );
    }, 2000);
  }, []);

  const handleDocumentDelete = (documentId: string) => {
    setAgent(agent.id, (prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== documentId),
    }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = e.dataTransfer.files;
      if (files?.length) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleSave = () => {
    // TODO: Implement save functionality
    agentsClient.updateAgent(agent).then((newAgent) => {
        setAgent(agent.id, (_) => newAgent);
        if (newAgent.databaseId !== agent.databaseId) {
            router.replace(`/agents/${newAgent.databaseId}`);
        }
    });
    // Temporary alert for demonstration
    alert("Agent configuration saved! (This is placeholder functionality)");
  };

  const models: LLM[] = [
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
  ];

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
            onClick={() => alert("Test Agent functionality coming soon!")}
          >
            <Bot className="mr-2 h-4 w-4" />
            Test Agent
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Upload Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Description
          </TabsTrigger>
          <TabsTrigger value="corpus" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Corpus
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Drama className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Model
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <div className="space-y-6">
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
                  <Textarea
                    id="system-prompt"
                    value={agent.systemPrompt}
                    onChange={(e) =>
                      handleInputChange("systemPrompt", e.target.value)
                    }
                    placeholder="Define the agent's personality and behavior"
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>
                  Control the agent&apos;s availability and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Active</Label>
                  <Switch
                    id="status"
                    checked={agent.status === "active"}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "status",
                        checked ? "active" : "inactive"
                      )
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
                    onCheckedChange={(checked) =>
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
                    onCheckedChange={(checked) =>
                      handleInputChange("enableWebSearch", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="corpus">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Documents</CardTitle>
                <CardDescription>
                  Upload and manage documents for this agent&apos;s knowledge
                  base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Drag and drop files here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleFileUpload(e.target.files);
                        }
                      }}
                      accept=".pdf,.doc,.docx,.txt,.md"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      className="mt-4"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: PDF, DOC, DOCX, TXT, MD
                  </p>
                </div>

                {/* Documents Table */}
                {agent.documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Uploaded Documents ({agent.documents.length})
                    </h4>
                    <div className="border rounded-lg">
                      <div className="grid grid-cols-5 gap-4 p-3 border-b bg-muted/50 text-sm font-medium">
                        <div>Name</div>
                        <div>Type</div>
                        <div>Size</div>
                        <div>Upload Date</div>
                        <div>Status</div>
                      </div>
                      {agent.documents.map((document) => (
                        <div
                          key={document.id}
                          className="grid grid-cols-5 gap-4 p-3 border-b last:border-b-0 items-center"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span
                              className="text-sm truncate"
                              title={document.name}
                            >
                              {document.name}
                            </span>
                          </div>
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {document.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {document.size}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {document.uploadDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={
                                document.status === "ready"
                                  ? "default"
                                  : document.status === "processing"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {document.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentDelete(document.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles">
            <RoleEditor documents={agent.documents} agent_id={agent.id} />
        </TabsContent>

        <TabsContent value="model">
          <div className="space-y-6">
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
                    onChange={(model) => setAgent(agent.id, (a) => ({ ...a, model }))}
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
                      handleInputChange(
                        "temperature",
                        parseFloat(e.target.value)
                      )
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
                <div className="grid gap-2">
                  <Label htmlFor="response-format">Response Format</Label>
                  <Select
                    value={agent.responseFormat}
                    onValueChange={(value) =>
                      handleInputChange("responseFormat", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select response format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="structured">Structured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
