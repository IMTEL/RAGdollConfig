"use client";

import axios from "axios";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectEmbeddingProps {
  selectedEmbedding?: string | null;
  onChange?: (embedding: string | null) => void;
  required?: boolean;
  allowedProviders?: string[];
  provider?: string | null;
  apiKey?: string | null;
  isApiKeyLoading?: boolean;
  apiKeyError?: string | null;
  disabled?: boolean;
}

export function SelectEmbedding({
  selectedEmbedding,
  onChange,
  required,
  allowedProviders,
  provider,
  apiKey,
  isApiKeyLoading,
  apiKeyError,
  disabled,
}: SelectEmbeddingProps) {
  const normalizedProvider = provider?.toLowerCase().trim() ?? null;
  const shouldFetch = Boolean(normalizedProvider && apiKey && !isApiKeyLoading);

  // Use TanStack Query to fetch embedding models
  const {
    data: embeddingModels = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["embeddingModels", normalizedProvider, apiKey],
    queryFn: async (): Promise<string[]> => {
      const response = await axios.post("/api/get-embedding-models", {
        provider: normalizedProvider,
        apiKey,
      });

      const data = response.data;
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }

      return data as string[];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    enabled: shouldFetch,
    retry: false,
  });

  const normalizedAllowedProviders = useMemo(() => {
    if (!allowedProviders?.length) return null;
    return allowedProviders.map((provider) => provider.toLowerCase());
  }, [allowedProviders]);

  const filteredEmbeddings = useMemo(() => {
    if (!embeddingModels) return [] as string[];
    if (!normalizedAllowedProviders?.length) return embeddingModels;
    return embeddingModels.filter((model) => {
      const provider = model.split(":", 1)[0]?.toLowerCase();
      return normalizedAllowedProviders.includes(provider);
    });
  }, [embeddingModels, normalizedAllowedProviders]);

  const onSelectEmbedding = (value: string) => {
    const embedding =
      filteredEmbeddings.find((model) => getKey(model) === value) ?? null;
    onChange?.(embedding ?? null);
  };

  const getKey = (model: string | null | undefined): string => {
    if (!model) return "";
    return model;
  };

  const prettyLabel = useMemo(() => {
    return (model: string) => {
      // Expecting format "provider:modelName"
      const [provider, name] = model.split(":", 2);
      if (name) return `${provider}: ${name}`;
      return model;
    };
  }, []);

  const fetchError = useMemo(() => {
    if (!shouldFetch) return null;
    if (!isError) return null;
    if (axios.isAxiosError(error)) {
      const message = (error.response?.data as { error?: string })?.error;
      return message ?? error.message;
    }
    if (error instanceof Error) return error.message;
    return "Failed to load embedding models";
  }, [error, isError, shouldFetch]);

  const selectDisabled =
    disabled ||
    !provider ||
    !apiKey ||
    isApiKeyLoading ||
    isLoading ||
    !!fetchError ||
    filteredEmbeddings.length === 0;

  const placeholderText = (() => {
    if (isApiKeyLoading) return "Loading API key...";
    if (apiKeyError) return apiKeyError;
    if (!provider || !apiKey) return "Select an API key first";
    if (isLoading) return "Loading embedding models...";
    if (fetchError) return fetchError;
    if ((filteredEmbeddings?.length ?? 0) === 0)
      return "No embedding models available";
    return "Select an embedding model";
  })();

  useEffect(() => {
    if ((!provider || !apiKey) && selectedEmbedding) {
      onChange?.(null);
    }
  }, [apiKey, onChange, provider, selectedEmbedding]);

  useEffect(() => {
    if (fetchError && selectedEmbedding) {
      onChange?.(null);
    }
  }, [fetchError, onChange, selectedEmbedding]);

  return (
    <div>
      <Select
        value={getKey(selectedEmbedding) ?? ""}
        onValueChange={onSelectEmbedding}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "cursor-pointer"
          )}
        >
          {isLoading ? (
            <SelectValue placeholder="Loading embedding models..." />
          ) : (
            <SelectValue placeholder={placeholderText} />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select an embedding model</SelectLabel>
            {fetchError ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                {fetchError}
              </div>
            ) : filteredEmbeddings.length === 0 ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                No embedding models available
              </div>
            ) : (
              filteredEmbeddings.map((model) => (
                <SelectItem
                  key={getKey(model)}
                  value={getKey(model)}
                  className="cursor-pointer"
                >
                  {prettyLabel(model)}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
