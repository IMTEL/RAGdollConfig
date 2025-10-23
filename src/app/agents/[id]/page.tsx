"use client";

import { useState, useCallback, useEffect } from "react";
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
  Key,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { use } from "react";
import {
  SelectModel,
} from "@/components/agent-configuration/select-model";
import { RoleEditor } from "@/components/agent-configuration/role-editor";
import { AgentUIState, agentsClient, DocumentMetadata, LLM } from "../agent_data";
import { useAgentActions, useAgents } from "../agent_provider";
import AccessKeysPage from "@/components/agent-configuration/access-key-page";

const CHAT_WEBSITE_URL = process.env.NEXT_PUBLIC_CHAT_WEBSITE_URL || "http://localhost:3001";
const RAGDOLL_BASE_URL = process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL || "http://localhost:8000";

export default function AgentConfigurationPage({
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

  // Load documents when the page opens
  useEffect(() => {
    // Only fetch if agent has a database ID and documents haven't been loaded yet
    if (agent.databaseId && agent.documents === null) {
      agentsClient.getDocumentsForAgent(agent.databaseId)
        .then((documents) => {
          setAgent(agent.id, (prev) => ({ ...prev, documents }));
        })
        .catch((error) => {
          console.error("Failed to load documents:", error);
          // Set to empty array on error so we don't keep retrying
          setAgent(agent.id, (prev) => ({ ...prev, documents: [] }));
        });
    }
  }, [agent.databaseId, agent.documents, agent.id, setAgent]);

  const registerUpdate = () => {
    const last_updated = new Date().toLocaleString("nb-NO", { dateStyle: "short", timeStyle: "short" });
    setAgent(agent.id, (prev) => ({ ...prev, uploaded: false, lastUpdated: last_updated }));
  }

  const [dragActive, setDragActive] = useState(false);
  const [embeddingError, setEmbeddingError] = useState<{
    show: boolean;
    title: string;
    message: string;
    fileName: string;
  }>({
    show: false,
    title: "",
    message: "",
    fileName: "",
  });

  const handleInputChange = (
    field: keyof AgentUIState,
    value: string | number | boolean | null
  ) => {
    registerUpdate()
    setAgent(agent.id, (prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    registerUpdate();
    
    // Create temporary IDs for UI tracking
    const tempIds = Array.from(files).map((_, index) => `temp-${Date.now()}-${index}`);
    
    const newDocuments: DocumentMetadata[] = Array.from(files).map((file, index) => ({
      id: tempIds[index],
      name: file.name,
      type: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadDate: new Date().toISOString().split("T")[0],
      status: "processing" as const,
    }));

    // Add documents to UI immediately
    setDocuments(agent.id, (prev) => [...prev, ...newDocuments]);

    // Upload each file to the backend
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("access_key", ""); // TODO: Replace with actual access key

      try {
        const response = await fetch(
          `${RAGDOLL_BASE_URL}/upload/agent/${agent.databaseId}`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          
          // Check if it's an embedding API error (401 or 400)
          if (response.status === 401) {
            // API Key authentication error
            setEmbeddingError({
              show: true,
              title: "Embedding API Authentication Failed",
              message: errorData.detail || "The API key does not have access to the configured embedding model. Please verify your API key permissions.",
              fileName: file.name,
            });
          } else if (response.status === 400 && errorData.detail?.includes("Embedding")) {
            // Invalid embedding model error
            setEmbeddingError({
              show: true,
              title: "Invalid Embedding Model",
              message: errorData.detail || "The configured embedding model is invalid or not found. Please check the agent's embedding model configuration.",
              fileName: file.name,
            });
          } else {
            // Generic error - show alert for any other error
            setEmbeddingError({
              show: true,
              title: "Upload Failed",
              message: errorData.detail || `Failed to upload document: ${response.statusText}`,
              fileName: file.name,
            });
          }
          
          // Update document status to error
          setDocuments(agent.id, (prev) =>
            prev.map((doc) =>
              doc.id === tempIds[index]
                ? { ...doc, status: "error" as const }
                : doc
            )
          );
          return; // Stop processing this file
        }

        const result = await response.json();
        console.log(`Successfully uploaded ${file.name}:`, result);

        // Update document with actual ID from backend and set status to ready
        setDocuments(agent.id, (prev) =>
          prev.map((doc) =>
            doc.id === tempIds[index]
              ? { ...doc, id: result.document_id, status: "ready" as const }
              : doc
          )
        );
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Update document status to error
        setDocuments(agent.id, (prev) =>
          prev.map((doc) =>
            doc.id === tempIds[index]
              ? { ...doc, status: "error" as const }
              : doc
          )
        );
      }
    }
  }, [agent.id, agent.databaseId]);

  const handleDocumentDelete = async (documentId: string) => {
    if (!documentId) {
      console.error("Cannot delete document: no ID provided");
      return;
    }

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    const prev_roles = agent.roles.map((role) => ({ ...role, documentAccess: [...role.documentAccess] }));
    try {
      // Optimistically remove from UI
      setAgent(agent.id, (prev) => ({
        ...prev,
        documents: prev.documents && prev.documents.filter((doc) => doc.id !== documentId),
        roles: prev.roles.map((role) => ({
          ...role,
          documentAccess: role.documentAccess.filter((docId) => docId !== documentId),
        })),
      }));

      // Call backend to delete
      await agentsClient.deleteDocument(documentId);
      
      registerUpdate();
      console.log(`Successfully deleted document ${documentId}`);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
      
      // Reload documents to restore UI state
      if (agent.databaseId) {
        const documents = await agentsClient.getDocumentsForAgent(agent.databaseId);
        setAgent(agent.id, (prev) => ({ ...prev, documents, roles: prev_roles }));
      }
    }
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
    alert("Agent configuration saved!");
  };

  const handleTestAgent = () => {
    // Log the attempt
    console.log('Testing agent:', agent.name, 'with ID:', agent.databaseId);

    try {
     // const chatUrl = `/chat?${params.toString()}`;
     const chatUrl = `${CHAT_WEBSITE_URL}/${agent.databaseId}`;
      window.open(chatUrl, '_blank');
    } catch (error) {
      console.error('Error launching chat:', error);
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
          <Button variant="outline" disabled={!agent.uploaded} onClick={handleTestAgent}>
            <Bot className="mr-2 h-4 w-4" />
            Test Agent
          </Button>
          <Button
            onClick={handleSave}
            className={
              agent.uploaded === false
                ? "animate-pulse ring-2 ring-offset-2 ring-sky-500 shadow-lg shadow-blue-500/60"
                : undefined
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Upload Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger
            value="accesskeys"
            className="flex items-center gap-2"
            disabled={agent.databaseId.length < 5}
          >
            <Key className="w-4 h-4" />
            Access Keys
          </TabsTrigger>
        </TabsList>{" "}
        <TabsContent value="description">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Configure the basic settings for your agent</CardDescription>
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
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what this agent does"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={agent.systemPrompt}
                    onChange={(e) => handleInputChange("systemPrompt", e.target.value)}
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
                    onCheckedChange={(checked) => handleInputChange("enableMemory", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="web-search">Web Search</Label>
                    <p className="text-xs text-muted-foreground">Search the web for information</p>
                  </div>
                  <Switch
                    id="web-search"
                    checked={agent.enableWebSearch}
                    onCheckedChange={(checked) => handleInputChange("enableWebSearch", checked)}
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
                  Upload and manage documents for this agent&apos;s knowledge base
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
                    <p className="text-lg font-medium">Drag and drop files here</p>
                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleFileUpload(e.target.files)
                        }
                      }}
                      accept=".pdf,.doc,.docx,.txt,.md"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
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
                {agent.documents === null ? (
                  <div className="flex items-center justify-center p-8 border rounded-lg">
                    <div className="text-muted-foreground">Loading documents...</div>
                  </div>
                ) : agent.documents.length > 0 ? (
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
                            <span className="text-sm truncate" title={document.name}>
                              {document.name}
                            </span>
                          </div>
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {document.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{document.size}</div>
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
                              onClick={() => document.id && handleDocumentDelete(document.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 border rounded-lg">
                    <div className="text-muted-foreground">No documents uploaded yet.</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="roles">
          <RoleEditor
            documents={agent.documents ?? []}
            agent_id={agent.id}
            onChange={registerUpdate}
          />
        </TabsContent>
        <TabsContent value="accesskeys">
          <AccessKeysPage agentId={agent.id} />
        </TabsContent>
        <TabsContent value="model">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
                <CardDescription>Configure the AI model and generation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <SelectModel
                    selectedModel={agent.model}
                    onChange={(model) => {
                      console.log("Selected model:", model)
                      registerUpdate()
                      setAgent(agent.id, (a) => ({ ...a, model }))
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="embedding-model">Embedding Model</Label>
                  <Input
                    id="embedding-model"
                    value={agent.embeddingModel || "Not set"}
                    readOnly
                    disabled
                    className="cursor-default"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperature">Temperature: {agent.temperature}</Label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={agent.temperature}
                    onChange={(e) => handleInputChange("temperature", parseFloat(e.target.value))}
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
                    onChange={(e) => handleInputChange("maxTokens", parseInt(e.target.value))}
                    placeholder="Maximum response length"
                    min="1"
                    max="4000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="response-format">Response Format</Label>
                  <Select
                    value={agent.responseFormat}
                    onValueChange={(value) => handleInputChange("responseFormat", value)}
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

      {/* Embedding Error Alert Dialog */}
      <AlertDialog open={embeddingError.show} onOpenChange={(open) => setEmbeddingError(prev => ({ ...prev, show: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-destructive" />
              {embeddingError.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  <strong>File:</strong> {embeddingError.fileName}
                </div>
                <div className="text-sm">
                  {embeddingError.message}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <strong>What to check:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Verify API keys</li>
                    <li>Ensure the API key has access to the embedding model: <code className="bg-muted px-1 py-0.5 rounded">{agent.embeddingModel}</code></li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setEmbeddingError(prev => ({ ...prev, show: false }))}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
