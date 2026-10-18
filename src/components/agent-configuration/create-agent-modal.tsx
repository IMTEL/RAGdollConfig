import {
  agentsClient,
  AgentUIState,
  KNOWLEDGE_SCOPE_OPTIONS,
  KnowledgeScope,
  LLM,
} from "@/app/(main)/agents/agent_data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import * as React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SelectEmbedding } from "./select-embedding";
import { SelectModel } from "./select-model";

type ApiKeyUsage = "llm" | "embedding" | "both";

interface StoredApiKey {
  id: string;
  label: string;
  provider: string;
  usage: ApiKeyUsage;
  redacted_key: string;
}

// Simple modal styles, adjust as needed for shadcn theme
export function AgentModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (agent: AgentUIState) => void;
}) {
  const [icon, setIcon] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [model, setModel] = React.useState<LLM | null>(null);
  const [embeddingModel, setEmbeddingModel] = React.useState<string | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [showValidationAlert, setShowValidationAlert] = React.useState(false);
  const [validationMessage, setValidationMessage] = React.useState("");
  const [apiKeys, setApiKeys] = React.useState<StoredApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = React.useState(false);
  const [apiKeysError, setApiKeysError] = React.useState<string | null>(null);
  const [llmKeyId, setLlmKeyId] = React.useState("");
  const [embeddingKeyId, setEmbeddingKeyId] = React.useState("");
  const [knowledgeScope, setKnowledgeScope] =
    React.useState<KnowledgeScope>("documents_first");

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadApiKeys = async () => {
      setApiKeysLoading(true);
      setApiKeysError(null);
      try {
        const response = await fetch("/api/get-api-keys");
        if (!response.ok) {
          throw new Error(`Failed to fetch API keys (${response.status})`);
        }
        const text = await response.text();
        if (!text) {
          setApiKeys([]);
          return;
        }
        const data: StoredApiKey[] = JSON.parse(text);
        if (!cancelled) {
          setApiKeys(data);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setApiKeys([]);
        setApiKeysError(
          error instanceof Error ? error.message : "Failed to load API keys"
        );
      } finally {
        if (!cancelled) {
          setApiKeysLoading(false);
        }
      }
    };

    void loadApiKeys();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const llmCompatibleKeys = React.useMemo(
    () => apiKeys.filter((key) => key.usage !== "embedding"),
    [apiKeys]
  );

  const embeddingCompatibleKeys = React.useMemo(
    () => apiKeys.filter((key) => key.usage !== "llm"),
    [apiKeys]
  );

  const selectedLlmKey = React.useMemo(
    () => llmCompatibleKeys.find((key) => key.id === llmKeyId) ?? null,
    [llmCompatibleKeys, llmKeyId]
  );

  const selectedEmbeddingKey = React.useMemo(
    () =>
      embeddingCompatibleKeys.find((key) => key.id === embeddingKeyId) ?? null,
    [embeddingCompatibleKeys, embeddingKeyId]
  );

  const resetForm = React.useCallback(() => {
    setIcon("");
    setName("");
    setDescription("");
    setModel(null);
    setEmbeddingModel(null);
    setLlmKeyId("");
    setEmbeddingKeyId("");
    setKnowledgeScope("documents_first");
    setValidationMessage("");
    setShowValidationAlert(false);
  }, []);

  const handleLlmKeyChange = React.useCallback(
    (keyId: string) => {
      setLlmKeyId(keyId);

      const key = llmCompatibleKeys.find((item) => item.id === keyId) ?? null;
      if (!key) {
        return;
      }

      if (
        model?.provider &&
        model.provider.toLowerCase() !== key.provider.toLowerCase()
      ) {
        setModel(null);
      }
    },
    [llmCompatibleKeys, model]
  );

  const handleEmbeddingKeyChange = React.useCallback(
    (keyId: string) => {
      setEmbeddingKeyId(keyId);

      const key =
        embeddingCompatibleKeys.find((item) => item.id === keyId) ?? null;
      if (!key) {
        return;
      }

      if (embeddingModel) {
        const currentProvider = embeddingModel.split(":", 1)[0]?.toLowerCase();
        if (currentProvider !== key.provider.toLowerCase()) {
          setEmbeddingModel(null);
        }
      }
    },
    [embeddingCompatibleKeys, embeddingModel]
  );

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const tryCreateAgent = async (
    name: string,
    description: string,
    embeddingModel: string,
    model: LLM | null,
    llmApiKeyId: string,
    embeddingApiKeyId: string,
    knowledgeScope: KnowledgeScope
  ): Promise<AgentUIState | null> => {
    try {
      // Stored keys are sent by id: the backend resolves them itself.
      return await agentsClient.createNewAgent(
        name,
        description,
        embeddingModel,
        model,
        llmApiKeyId,
        embeddingApiKeyId,
        knowledgeScope
      );
    } catch (e) {
      alert("Failed to create a new agent: " + e);
      console.error(e);
      return null;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    if (!selectedLlmKey) {
      setValidationMessage(
        "Please select an API key for the language model before creating the agent."
      );
      setShowValidationAlert(true);
      return;
    }

    // Validate model is selected
    if (!model) {
      setValidationMessage(
        "Please select a language model before creating the agent."
      );
      setShowValidationAlert(true);
      return;
    }

    // Validate embedding model is selected
    if (!embeddingModel) {
      setValidationMessage(
        "Please select an embedding model before creating the agent."
      );
      setShowValidationAlert(true);
      return;
    }

    if (!selectedEmbeddingKey) {
      setValidationMessage(
        "Please select an API key for the embedding provider before creating the agent."
      );
      setShowValidationAlert(true);
      return;
    }

    setLoading(true);

    try {
      const agent = await tryCreateAgent(
        name,
        description,
        embeddingModel,
        model,
        selectedLlmKey.id,
        selectedEmbeddingKey.id,
        knowledgeScope
      );
      if (agent) {
        onCreate(agent);
        resetForm();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed top-0 right-0 bottom-0 left-0 z-50 flex min-h-screen items-center justify-center bg-black/40"
      )}
    >
      <div
        className={cn("bg-background w-full max-w-md rounded-lg p-6 shadow-lg")}
      >
        <h2 className={cn("mb-4 text-lg font-semibold")}>Create Agent</h2>
        <form onSubmit={handleSubmit} className={cn("space-y-4")}>
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {apiKeysError && (
            <p className="text-destructive text-sm">{apiKeysError}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="llm-api-key">Language model API key</Label>
            <Select
              value={llmKeyId}
              onValueChange={handleLlmKeyChange}
              disabled={
                apiKeysLoading || llmCompatibleKeys.length === 0 || loading
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    apiKeysLoading
                      ? "Loading API keys..."
                      : llmCompatibleKeys.length === 0
                        ? "No compatible keys available"
                        : "Select an API key"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available API keys</SelectLabel>
                  {llmCompatibleKeys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.label} · {key.redacted_key}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {!apiKeysLoading &&
              llmCompatibleKeys.length === 0 &&
              !apiKeysError && (
                <p className="text-muted-foreground text-sm">
                  Add an API key with LLM access from the API Keys page before
                  creating an agent.
                </p>
              )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedding-api-key">Embedding API key</Label>
            <Select
              value={embeddingKeyId}
              onValueChange={handleEmbeddingKeyChange}
              disabled={
                apiKeysLoading ||
                embeddingCompatibleKeys.length === 0 ||
                loading
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    apiKeysLoading
                      ? "Loading API keys..."
                      : embeddingCompatibleKeys.length === 0
                        ? "No compatible keys available"
                        : "Select an API key"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available API keys</SelectLabel>
                  {embeddingCompatibleKeys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.label} · {key.redacted_key}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {!apiKeysLoading &&
              embeddingCompatibleKeys.length === 0 &&
              !apiKeysError && (
                <p className="text-muted-foreground text-sm">
                  Add an API key that supports embedding access before creating
                  an agent.
                </p>
              )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Language Model</Label>
            <SelectModel
              selectedModel={model}
              onChange={(model) => setModel(model)}
              allowedProviders={
                selectedLlmKey ? [selectedLlmKey.provider] : undefined
              }
              provider={selectedLlmKey?.provider ?? null}
              apiKeyId={selectedLlmKey?.id ?? null}
              disabled={!selectedLlmKey}
            />
            <p className="text-muted-foreground text-sm">
              The language model that will generate responses for this agent.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedding-model">Embedding Model</Label>
            <SelectEmbedding
              selectedEmbedding={embeddingModel}
              onChange={(embedding) => setEmbeddingModel(embedding)}
              required
              allowedProviders={
                selectedEmbeddingKey
                  ? [selectedEmbeddingKey.provider]
                  : undefined
              }
              provider={selectedEmbeddingKey?.provider ?? null}
              apiKeyId={selectedEmbeddingKey?.id ?? null}
              disabled={!selectedEmbeddingKey}
            />
            <p className="text-muted-foreground text-sm">
              The embedding model is used to determine which documents from the
              knowledge base are relevant to the conversation.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="knowledge-scope">Knowledge source</Label>
            <Select
              value={knowledgeScope}
              onValueChange={(value) =>
                setKnowledgeScope(value as KnowledgeScope)
              }
              disabled={loading}
            >
              <SelectTrigger id="knowledge-scope" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KNOWLEDGE_SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              Whether the agent may answer questions its documents don&apos;t
              cover.
            </p>
          </div>
          <div className={cn("flex justify-end gap-2")}>
            <button
              type="button"
              className={cn(
                "bg-muted text-foreground hover:bg-muted/80 cursor-pointer rounded-md px-4 py-2 transition-colors"
              )}
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-md px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              )}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      <AlertDialog
        open={showValidationAlert}
        onOpenChange={setShowValidationAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Required Field Missing</AlertDialogTitle>
            <AlertDialogDescription>{validationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
