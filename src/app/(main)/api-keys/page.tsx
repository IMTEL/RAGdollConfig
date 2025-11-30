"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProviderOption {
  id: string;
  label: string;
}

interface ProvidersResponse {
  llm: ProviderOption[];
  embedding: ProviderOption[];
}

interface ApiKeyResponseItem {
  id: string;
  label: string;
  provider: string;
  usage: "llm" | "embedding" | "both";
  redacted_key: string;
  created_at: string;
}

interface ApiKeyItem {
  id: string;
  label: string;
  provider: string;
  usage: "llm" | "embedding" | "both";
  redactedKey: string;
  createdAt: string;
}

const usageOptions = [
  { value: "llm", label: "LLM models" },
  { value: "embedding", label: "Embedding models" },
  { value: "both", label: "LLM and embedding" },
];

const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/app";
const appApi = (path: string) => `${APP_BASE_PATH}${path}`;

export default function ApiKeysPage() {
  const [keyLabel, setKeyLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [usage, setUsage] = useState<string | undefined>(undefined);
  const [providers, setProviders] = useState<ProvidersResponse | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchProviders() {
      try {
        setProviderError(null);
        const response = await fetch(appApi("/api/get-providers"));
        if (!response.ok) {
          throw new Error(`Failed to fetch providers (${response.status})`);
        }
        const data: ProvidersResponse = await response.json();
        if (isMounted) {
          setProviders(data);
        }
      } catch (error) {
        if (isMounted) {
          setProviders(null);
          setProviderError(
            error instanceof Error ? error.message : "Failed to load providers"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingProviders(false);
        }
      }
    }

    fetchProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadApiKeys = useCallback(async (withSpinner = false) => {
    if (withSpinner) {
      setIsLoadingKeys(true);
    }

    try {
      setKeysError(null);
      const response = await fetch(appApi("/api/get-api-keys"));
      if (!response.ok) {
        throw new Error(`Failed to fetch API keys (${response.status})`);
      }
      const data: ApiKeyResponseItem[] = await response.json();
      if (!isMountedRef.current) {
        return;
      }
      setApiKeys(
        data.map((item) => ({
          id: item.id,
          label: item.label,
          provider: item.provider,
          usage: item.usage,
          redactedKey: item.redacted_key,
          createdAt: item.created_at,
        }))
      );
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      setApiKeys([]);
      setKeysError(
        error instanceof Error ? error.message : "Failed to load API keys"
      );
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    loadApiKeys(true);
  }, [loadApiKeys]);

  const providerLabels = useMemo(() => {
    const map = new Map<string, string>();
    if (!providers) return map;
    for (const group of [providers.llm ?? [], providers.embedding ?? []]) {
      for (const item of group) {
        if (!map.has(item.id)) {
          map.set(item.id, item.label);
        }
      }
    }
    return map;
  }, [providers]);

  const availableProviders = useMemo(() => {
    if (!providers) return [] as ProviderOption[];

    const llmProviders = providers.llm ?? [];
    const embeddingProviders = providers.embedding ?? [];

    switch (usage) {
      case "llm":
        return llmProviders;
      case "embedding":
        return embeddingProviders;
      case "both": {
        const embeddingIds = new Set(embeddingProviders.map((item) => item.id));
        return llmProviders.filter((item) => embeddingIds.has(item.id));
      }
      default: {
        const combined = new Map<string, ProviderOption>();
        for (const item of [...llmProviders, ...embeddingProviders]) {
          if (!combined.has(item.id)) {
            combined.set(item.id, item);
          }
        }
        return Array.from(combined.values());
      }
    }
  }, [providers, usage]);

  useEffect(() => {
    if (!provider) return;
    const stillValid = availableProviders.some((item) => item.id === provider);
    if (!stillValid) {
      setProvider(undefined);
    }
  }, [availableProviders, provider]);

  const providerSelectDisabled =
    isLoadingProviders || availableProviders.length === 0;

  const canSave =
    keyLabel.trim().length > 0 &&
    apiKey.trim().length > 0 &&
    Boolean(provider) &&
    Boolean(usage);

  const resetFormFields = useCallback(() => {
    setKeyLabel("");
    setApiKey("");
    setProvider(undefined);
    setUsage(undefined);
    setFormError(null);
    setIsSaving(false);
  }, []);

  const openModal = useCallback(() => {
    resetFormFields();
    setIsModalOpen(true);
  }, [resetFormFields]);

  const closeModal = useCallback(() => {
    resetFormFields();
    setIsModalOpen(false);
  }, [resetFormFields]);

  const handleSave = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    const trimmedLabel = keyLabel.trim();
    const trimmedKey = apiKey.trim();

    if (!trimmedLabel || !trimmedKey || !provider || !usage) {
      setFormError("Please complete all fields before saving.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const response = await fetch(appApi("/api/get-api-keys"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: trimmedLabel,
          provider,
          usage,
          raw_key: trimmedKey,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          (typeof errorBody?.detail === "string" && errorBody.detail) ||
          (typeof errorBody?.error === "string" && errorBody.error) ||
          `Failed to save API key (${response.status})`;
        throw new Error(message);
      }

      await loadApiKeys();

      if (!isMountedRef.current) {
        return;
      }
      closeModal();
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      setFormError(
        error instanceof Error ? error.message : "Failed to save API key"
      );
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      setIsSaving(false);
    }
  }, [apiKey, closeModal, keyLabel, loadApiKeys, provider, usage]);

  const renderKeys = () => {
    if (isLoadingKeys) {
      return Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="border-muted/60 bg-muted/10 animate-pulse rounded-lg border p-4"
        >
          <div className="bg-muted h-4 w-48 rounded" />
          <div className="bg-muted mt-2 h-3 w-32 rounded" />
        </div>
      ));
    }

    if (keysError) {
      return <div className="text-destructive text-sm">{keysError}</div>;
    }

    if (apiKeys.length === 0) {
      return (
        <div className="text-muted-foreground text-sm">
          No API keys registered yet.
        </div>
      );
    }

    return apiKeys.map((item) => {
      const providerLabel = providerLabels.get(item.provider) ?? item.provider;
      const createdDate = new Date(item.createdAt);
      const createdLabel = Number.isNaN(createdDate.getTime())
        ? null
        : createdDate.toLocaleString();
      return (
        <div
          key={item.id}
          className="border-muted/60 bg-muted/10 flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.label}</span>
              <Badge variant="secondary">{providerLabel}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{item.redactedKey}</p>
            {createdLabel && (
              <p className="text-muted-foreground text-xs">
                Added {createdLabel}
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 md:items-end md:text-right">
            <Badge
              variant={item.usage === "both" ? "default" : "outline"}
              className="w-fit md:self-end"
            >
              {item.usage === "llm"
                ? "LLM access"
                : item.usage === "embedding"
                  ? "Embedding access"
                  : "LLM and embedding"}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="bg-transparent transition-colors hover:bg-red-500 hover:text-white"
              aria-label={`Delete key ${item.label}`}
              onClick={() => alert("Not implemented")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground max-w-2xl">
            Register and organize credentials for large language models and
            embedding providers. This interface captures the required metadata
            so keys can later be scoped to the right runtime components.
          </p>
        </div>
        <Button type="button" onClick={openModal} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add API key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stored keys</CardTitle>
          <CardDescription>
            Keys you register are stored securely per account. Only you can see
            the entries below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">{renderKeys()}</CardContent>
      </Card>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="bg-background relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Add a new key</h2>
                <p className="text-muted-foreground text-sm">
                  Provide the key metadata and the raw credential. Keys close
                  after saving.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeModal}
                aria-label="Close add key dialog"
              >
                <X className="size-4" />
              </Button>
            </div>
            <form
              className="grid gap-6 px-6 py-6"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyLabel">Key label</Label>
                  <Input
                    id="keyLabel"
                    placeholder="Production LLM key"
                    value={keyLabel}
                    onChange={(event) => {
                      setKeyLabel(event.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={provider}
                    onValueChange={(value) => {
                      setProvider(value);
                      if (formError) setFormError(null);
                    }}
                    disabled={providerSelectDisabled}
                  >
                    <SelectTrigger
                      className="w-full"
                      disabled={providerSelectDisabled}
                    >
                      <SelectValue
                        placeholder={
                          isLoadingProviders
                            ? "Loading providers..."
                            : "Select a provider"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.length > 0 ? (
                        availableProviders.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-muted-foreground px-3 py-2 text-sm">
                          {providerError
                            ? providerError
                            : isLoadingProviders
                              ? "Loading providers..."
                              : "No providers available"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {providerError && !isLoadingProviders && (
                    <p className="text-destructive text-sm">{providerError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Usage</Label>
                  <Select
                    value={usage}
                    onValueChange={(value) => {
                      setUsage(value);
                      if (formError) setFormError(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select usage" />
                    </SelectTrigger>
                    <SelectContent>
                      {usageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={!canSave || isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? "Saving..." : "Save key"}
                </Button>
                {formError && (
                  <p className="text-destructive text-sm">{formError}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
