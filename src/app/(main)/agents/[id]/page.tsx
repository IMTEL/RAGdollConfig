"use client";

import { use, useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  AlertTriangle,
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
import axios from "axios";
import { SelectModel } from "@/components/agent-configuration/select-model";
import { RoleEditor } from "@/components/agent-configuration/role-editor";
import { TestAgent } from "@/components/agent-configuration/test-agent-button";
import { AgentUIState, agentsClient, DocumentMetadata } from "../agent_data";
import { useAgentActions, useAgents } from "../agent_provider";
import AccessKeysPage from "@/components/agent-configuration/access-key-page";
import { DeleteAgent } from "@/components/agent-configuration/delete-agent-button";

const CHAT_WEBSITE_URL =
  process.env.NEXT_PUBLIC_CHAT_WEBSITE_URL || "http://localhost:3001";
const RAGDOLL_BASE_URL =
  process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL || "http://localhost:8000";
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/app";
const appApi = (path: string) => `${APP_BASE_PATH}${path}`;

export default function AgentConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { state } = useAgents();
  const { setAgent, setDocuments } = useAgentActions();
  const router = useRouter();
  const { id } = use(params);

  const agent = state.find(
    (agent) => agent.databaseId === id || agent.id === id
  );

  if (!agent) {
    return <div> Agent not found </div>;
  }

  // Load documents when the page opens
  useEffect(() => {
    // Only fetch if agent has a database ID and documents haven't been loaded yet
    if (agent.databaseId && agent.documents === null) {
      agentsClient
        .getDocumentsForAgent(agent.databaseId)
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
    const last_updated = new Date().toLocaleString("nb-NO", {
      dateStyle: "short",
      timeStyle: "short",
    });
    setAgent(agent.id, (prev) => ({
      ...prev,
      uploaded: false,
      lastUpdated: last_updated,
    }));
  };

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
  const [activeTab, setActiveTab] = useState("description");
  const [useGraphSearch, setUseGraphSearch] = useState(false);

  const handleInputChange = (
    field: keyof AgentUIState,
    value: string | number | boolean | null
  ) => {
    registerUpdate();
    setAgent(agent.id, (prev) => ({ ...prev, [field]: value }));
  };

  const pollUploadStatus = useCallback(
    async ({
      taskId,
      tempId,
      fileName,
      agentId,
      backendAgentId,
    }: {
      taskId: string;
      tempId: string;
      fileName: string;
      agentId: string;
      backendAgentId: string;
    }) => {
      const wait = (ms: number) =>
        new Promise((resolve) => {
          setTimeout(resolve, ms);
        });

      if (!backendAgentId) {
        return;
      }

      while (true) {
        try {
          const statusResponse = await axios.get(
            appApi("/api/upload-status"),
            {
              params: { taskId },
            }
          );

          if (statusResponse.status === 200) {
            const statusData = statusResponse.data;
            const taskStatus: string | undefined = statusData.status;

            const isCompleteStatus =
              taskStatus === "complete" ||
              taskStatus === "ready" ||
              taskStatus === "processing_complete";

            if (isCompleteStatus) {
              const backendDocuments: DocumentMetadata[] =
                await agentsClient.getDocumentsForAgent(backendAgentId);

              const readyDoc: DocumentMetadata | undefined =
                backendDocuments.find((doc) =>
                  statusData.document_id
                    ? doc.id === statusData.document_id
                    : false
                ) ?? backendDocuments.find((doc) => doc.name === fileName);

              if (!readyDoc) {
                await wait(2000);
                continue;
              }

              setDocuments(agentId, (prev) => {
                const readyDocsById = new Set(
                  backendDocuments
                    .map((doc) => doc.id)
                    .filter((value): value is string => Boolean(value))
                );
                const readyDocsByName = new Set(
                  backendDocuments
                    .map((doc) => doc.name)
                    .filter((value): value is string => Boolean(value))
                );

                const hydratedReadyDocs = backendDocuments.map((doc) => ({
                  ...doc,
                  status: "ready" as const,
                }));

                const placeholders = prev.filter((doc) => {
                  if (doc.id === tempId) {
                    return false;
                  }

                  if (doc.id && readyDocsById.has(doc.id)) {
                    return false;
                  }

                  if (readyDocsByName.has(doc.name)) {
                    return false;
                  }

                  return doc.status !== "ready";
                });

                return [...hydratedReadyDocs, ...placeholders];
              });

              return;
            }

            if (taskStatus === "failed" || taskStatus === "error") {
              setDocuments(agentId, (prev) =>
                prev.map((doc) =>
                  doc.id === tempId ? { ...doc, status: "error" as const } : doc
                )
              );

              setEmbeddingError({
                show: true,
                title: "Upload Failed",
                message:
                  statusData.message ||
                  "Document processing failed. Please try again.",
                fileName,
              });

              return;
            }
          }
        } catch (error) {
          console.error("Failed to poll upload status:", error);
          // Continue polling on transient errors
        }

        await wait(2000);
      }
    },
    [setDocuments, setEmbeddingError]
  );

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      registerUpdate();

      // Create temporary IDs for UI tracking
      const tempIds = Array.from(files).map(
        (_, index) => `temp-${Date.now()}-${index}`
      );

      const newDocuments: DocumentMetadata[] = Array.from(files).map(
        (file, index) => ({
          id: tempIds[index],
          name: file.name,
          type: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
          size: `${(file.size / 1024).toFixed(1)} KB`,
          uploadDate: new Date().toISOString().split("T")[0],
          status: "processing" as const,
        })
      );

      // Add documents to UI immediately
      setDocuments(agent.id, (prev) => [...prev, ...newDocuments]);

      // Upload each file to the backend
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("categories", "General Information"); // TODO: Replace with actual categories

        try {
          const response = await axios.post(
            appApi(`/api/upload-document`),
            formData,
            {
              params: { agentId: agent.id },
              validateStatus: () => true, // Don't throw on any status code
            }
          );

          if (response.status !== 200) {
            const errorData = response.data || { detail: response.statusText };

            // Check if it's an embedding API error (401 or 400)
            if (response.status === 401) {
              // API Key authentication error
              setEmbeddingError({
                show: true,
                title: "Embedding API Authentication Failed",
                message:
                  errorData.detail ||
                  "The API key does not have access to the configured embedding model. Please verify your API key permissions.",
                fileName: file.name,
              });
            } else if (
              response.status === 400 &&
              errorData.detail?.includes("Embedding")
            ) {
              // Invalid embedding model error
              setEmbeddingError({
                show: true,
                title: "Invalid Embedding Model",
                message:
                  errorData.detail ||
                  "The configured embedding model is invalid or not found. Please check the agent's embedding model configuration.",
                fileName: file.name,
              });
            } else {
              // Generic error - show alert for any other error
              setEmbeddingError({
                show: true,
                title: "Upload Failed",
                message:
                  errorData.detail ||
                  `Failed to upload document: ${response.statusText}`,
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

          const result = response.data;
          console.log(`Successfully uploaded ${file.name}:`, result);

          const backendAgentId = agent.databaseId || agent.id;
          const taskId: string | undefined = result?.task_id;

          if (taskId) {
            void pollUploadStatus({
              taskId,
              tempId: tempIds[index],
              fileName: file.name,
              agentId: agent.id,
              backendAgentId,
            }).catch((error) =>
              console.error("Failed to track upload completion:", error)
            );
          } else if (backendAgentId) {
            // Fallback: refresh documents once if no task tracking information is returned
            try {
              const backendDocuments =
                await agentsClient.getDocumentsForAgent(backendAgentId);
              const readyDoc = backendDocuments.find(
                (doc) => doc.name === file.name
              );

              if (readyDoc) {
                setDocuments(agent.id, (prev) => {
                  const others = prev.filter(
                    (doc) => doc.id !== tempIds[index]
                  );
                  return [...others, { ...readyDoc, status: "ready" as const }];
                });
              }
            } catch (refreshError) {
              console.error(
                "Failed to refresh documents after upload:",
                refreshError
              );
            }
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);

          // Show error dialog for network or other errors
          setEmbeddingError({
            show: true,
            title: "Upload Failed",
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred during upload.",
            fileName: file.name,
          });

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
    },
    [
      agent.id,
      agent.databaseId,
      pollUploadStatus,
      setDocuments,
      setEmbeddingError,
    ]
  );

  const handleDocumentDelete = async (documentId: string) => {
    if (!documentId) {
      console.error("Cannot delete document: no ID provided");
      return;
    }

    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      return;
    }
    const prev_roles = agent.roles.map((role) => ({
      ...role,
      documentAccess: [...role.documentAccess],
    }));
    try {
      // Optimistically remove from UI
      setAgent(agent.id, (prev) => ({
        ...prev,
        documents:
          prev.documents &&
          prev.documents.filter((doc) => doc.id !== documentId),
        roles: prev.roles.map((role) => ({
          ...role,
          documentAccess: role.documentAccess.filter(
            (docId) => docId !== documentId
          ),
        })),
      }));

      // Call backend to delete
      await agentsClient.deleteDocument(documentId, agent.id);

      registerUpdate();
      console.log(`Successfully deleted document ${documentId}`);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");

      // Reload documents to restore UI state
      if (agent.databaseId) {
        const documents = await agentsClient.getDocumentsForAgent(
          agent.databaseId
        );
        setAgent(agent.id, (prev) => ({
          ...prev,
          documents,
          roles: prev_roles,
        }));
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
    console.log("Testing agent:", agent.name, "with ID:", agent.databaseId);

    try {
      // const chatUrl = `/chat?${params.toString()}`;
      const chatUrl = `${CHAT_WEBSITE_URL}/${agent.databaseId}`;
      window.open(chatUrl, "_blank");
    } catch (error) {
      console.error("Error launching chat:", error);
      alert("Failed to launch chat interface. Please try again.");
    }
  };

  // Check if there are documents not accessed by any role
  const unaccessedDocuments = useMemo(() => {
    if (!agent.documents || agent.documents.length === 0) return [];

    const accessedDocIds = new Set<string>();
    agent.roles.forEach((role) => {
      role.documentAccess.forEach((docId) => accessedDocIds.add(docId));
    });

    return agent.documents.filter(
      (doc) => doc.id && !accessedDocIds.has(doc.id)
    );
  }, [agent.documents, agent.roles]);

  // Determine temperature max based on model provider
  const tempMax = agent.model?.provider?.toLowerCase() === "idun" ? 2 : 1;

  // Clamp temperature if it exceeds the allowed max for the selected model
  useEffect(() => {
    if (typeof agent.temperature === "number" && agent.temperature > tempMax) {
      registerUpdate();
      setAgent(agent.id, (prev) => ({ ...prev, temperature: tempMax }));
    }
  }, [tempMax, agent.temperature, agent.id]);

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
          <TestAgent agent={agent} />
          <Button
            onClick={handleSave}
            className={
              agent.uploaded === false
                ? "animate-pulse shadow-lg ring-2 shadow-blue-500/60 ring-sky-500 ring-offset-2"
                : undefined
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Upload Changes
          </Button>
          <DeleteAgent
            agent={agent}
            onSuccess={() => {
              router.push("/agents");
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="description"
        className="space-y-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="description" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Description
          </TabsTrigger>
          <TabsTrigger value="corpus" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Corpus
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Drama className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Model
          </TabsTrigger>
          <TabsTrigger
            value="accesskeys"
            className="flex items-center gap-2"
            disabled={agent.databaseId.length < 5}
          >
            <Key className="h-4 w-4" />
            Access Keys
          </TabsTrigger>
        </TabsList>{" "}
        <TabsContent value="description">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Configure the basic settings for your agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <p className="text-muted-foreground text-sm">
                    The agent will not use this, it's just for your reference.
                  </p>
                  <Input
                    id="name"
                    value={agent.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter agent name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <p className="text-muted-foreground text-sm">
                    The agent will not use this, it's just for your reference.
                  </p>
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
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>General Agent Prompt</CardTitle>
                <CardDescription>
                  Overarching instructions for how every role in this agent
                  should behave. The agent will use what you write here
                  directly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Textarea
                    id="system-prompt"
                    value={agent.systemPrompt}
                    onChange={(e) =>
                      handleInputChange("systemPrompt", e.target.value)
                    }
                    placeholder="Describe the roles common personality and behavior"
                    rows={6}
                    className={`min-h-[180px] ${
                      agent.systemPrompt.trim() === ""
                        ? "animate-pulse ring-2 ring-blue-400 ring-offset-2"
                        : ""
                    }`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* TODO: Uncomment this UI if/when the functionallity is implemented in the backend */}

            {/* <Card>
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
            </Card> */}
          </div>
        </TabsContent>
        <TabsContent value="corpus">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="h-fit">
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
                  className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Drag and drop files here
                    </p>
                    <p className="text-muted-foreground text-sm">
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
                  <p className="text-muted-foreground mt-4 text-xs">
                    Supported formats: PDF, DOC, DOCX, TXT, MD
                  </p>
                </div>

                {/* Warning for unaccessed documents */}
                {unaccessedDocuments.length > 0 && (
                  <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {unaccessedDocuments.length} document
                        {unaccessedDocuments.length !== 1 ? "s are" : " is"} not
                        accessed by any role
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Documents:{" "}
                        {unaccessedDocuments.map((doc, index) => (
                          <span key={doc.id || `unaccessed-${index}`}>
                            {index > 0 ? ", " : ""}
                            {doc.name}
                          </span>
                        ))}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Add a new role that has access to{" "}
                        {unaccessedDocuments.length !== 1
                          ? "these documents"
                          : "this document"}{" "}
                        or edit an existing role.{" "}
                        <button
                          onClick={() => setActiveTab("roles")}
                          className="cursor-pointer font-medium underline hover:text-yellow-900 dark:hover:text-yellow-100"
                        >
                          Go to roles page
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* Documents Table */}
                {agent.documents === null ? (
                  <div className="flex items-center justify-center rounded-lg border p-8">
                    <div className="text-muted-foreground">
                      Loading documents...
                    </div>
                  </div>
                ) : agent.documents.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Uploaded Documents ({agent.documents.length})
                    </h4>
                    <div className="rounded-lg border">
                      <div className="bg-muted/50 grid grid-cols-5 gap-4 border-b p-3 text-sm font-medium">
                        <div>Name</div>
                        <div>Type</div>
                        <div>Size</div>
                        <div>Upload Date</div>
                        <div>Status</div>
                      </div>
                      {agent.documents.map((document, index) => (
                        <div
                          key={document.id || `document-${index}`}
                          className="grid grid-cols-5 items-center gap-4 border-b p-3 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="text-muted-foreground h-4 w-4" />
                            <span
                              className="truncate text-sm"
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
                          <div className="text-muted-foreground text-sm">
                            {document.size}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
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
                              onClick={() =>
                                document.id && handleDocumentDelete(document.id)
                              }
                              className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-lg border p-8">
                    <div className="text-muted-foreground">
                      No documents uploaded yet.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>RAG Retrieval Settings</CardTitle>
                <CardDescription>
                  Configure parameters for document retrieval and context
                  generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="graph-search-toggle">
                        Retrieval Mode
                      </Label>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm">
                          Hybrid
                        </span>
                        <Switch
                          id="graph-search-toggle"
                          checked={useGraphSearch}
                          onCheckedChange={setUseGraphSearch}
                          aria-describedby="graph-search-helper"
                        />
                        <span className="text-muted-foreground text-sm">
                          Graph
                        </span>
                      </div>
                    </div>
                    {useGraphSearch && (
                      <p
                        id="graph-search-helper"
                        className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800"
                      >
                        Not implemented.
                      </p>
                    )}
                  </div>
                </div>
                {/* add here */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="topK">Maximum Number of References</Label>
                    <span className="text-sm font-medium">{agent.topK}</span>
                  </div>
                  <input
                    id="topK"
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={agent.topK}
                    onChange={(e) =>
                      handleInputChange("topK", parseInt(e.target.value))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="similarityThreshold">
                      Similarity Threshold
                    </Label>
                    <span className="text-sm font-medium">
                      {agent.similarityThreshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    id="similarityThreshold"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={agent.similarityThreshold}
                    onChange={(e) =>
                      handleInputChange(
                        "similarityThreshold",
                        parseFloat(e.target.value)
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                  />
                  <p className="text-muted-foreground text-sm">
                    Minimum similarity score for retrieved documents (0.0-1.0)
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hybridSearchAlpha">Search Type</Label>
                    <span className="text-sm font-medium">
                      {agent.hybridSearchAlpha.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      id="hybridSearchAlpha"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={agent.hybridSearchAlpha}
                      onChange={(e) =>
                        handleInputChange(
                          "hybridSearchAlpha",
                          parseFloat(e.target.value)
                        )
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                    />
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                      <span>Keyword</span>
                      <span>Semantic</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    ({(agent.hybridSearchAlpha * 100).toFixed(0)}% semantic
                    search, {((1 - agent.hybridSearchAlpha) * 100).toFixed(0)}%
                    keyword search)
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="contextAwareRetrieval">
                      Context-Aware Retrieval
                    </Label>
                    <Switch
                      id="contextAwareRetrieval"
                      checked={agent.contextAwareRetrieval}
                      onCheckedChange={(checked) =>
                        handleInputChange("contextAwareRetrieval", checked)
                      }
                    />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    If disabled, only the latest message will be used for
                    retrieval.
                  </p>
                </div>
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
                <CardDescription>
                  Configure the AI model and generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <SelectModel
                    selectedModel={agent.model}
                    onChange={(model) => {
                      registerUpdate();
                      setAgent(agent.id, (a) => ({ ...a, model }));
                    }}
                    allowedProviders={
                      agent.model?.provider ? [agent.model.provider] : undefined
                    }
                    provider={agent.model?.provider ?? null}
                    apiKey={agent.llmApiKey}
                    disabled={!agent.llmApiKey}
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
                  <Label htmlFor="temperature">
                    Temperature: {agent.temperature}
                  </Label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max={tempMax}
                    step="0.1"
                    value={agent.temperature}
                    onChange={(e) =>
                      handleInputChange(
                        "temperature",
                        parseFloat(e.target.value)
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                  />
                  <div className="text-muted-foreground flex justify-between text-xs">
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
                {/* <div className="grid gap-2">
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
                </div> */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Embedding Error Alert Dialog */}
      <AlertDialog
        open={embeddingError.show}
        onOpenChange={(open) =>
          setEmbeddingError((prev) => ({ ...prev, show: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Upload className="text-destructive h-5 w-5" />
              {embeddingError.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  <strong>File:</strong> {embeddingError.fileName}
                </div>
                <div className="text-sm">{embeddingError.message}</div>
                <div className="text-muted-foreground mt-2 text-xs">
                  <strong>What to check:</strong>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    <li>Verify API keys</li>
                    <li>
                      Ensure the API key has access to the embedding model:{" "}
                      <code className="bg-muted rounded px-1 py-0.5">
                        {agent.embeddingModel}
                      </code>
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() =>
                setEmbeddingError((prev) => ({ ...prev, show: false }))
              }
            >
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
