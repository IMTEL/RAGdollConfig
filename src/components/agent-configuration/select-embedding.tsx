"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useQuery } from "@tanstack/react-query";
import { LLM } from "@/app/agents/agent_data";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SelectEmbeddingProps {
  selectedEmbedding?: LLM | null;
  onChange?: (embedding: LLM | null) => void;
}

const RAGDOLL_BASE_URL =
  process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL || "http://localhost:8000";

// Fetch embedding models from the backend
async function fetchEmbeddingModels(): Promise<LLM[]> {
  const response = await fetch(`${RAGDOLL_BASE_URL}/get_embedding_models`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch embedding models");
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format");
  }
  
  return data as LLM[];
}

export function SelectEmbedding({
  selectedEmbedding,
  onChange,
}: SelectEmbeddingProps) {
  const [showGDPRWarning, setShowGDPRWarning] = useState<boolean>(false);
  const [pendingEmbedding, setPendingEmbedding] = useState<LLM | null>(null);

  // Use TanStack Query to fetch embedding models
  const {
    data: embeddingModels = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["embeddingModels"],
    queryFn: fetchEmbeddingModels,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });

  const onSelectEmbedding = (value: string) => {
    const embedding =
      embeddingModels.find((model) => getKey(model) === value) ?? null;
    
    if (!embedding?.GDPR_compliant) {
      setShowGDPRWarning(true);
      setPendingEmbedding(embedding);
      return;
    }
    onChange?.(embedding);
  };

  const warningSelectContinue = () => {
    setShowGDPRWarning(false);
    onChange?.(pendingEmbedding);
  };

  const warningSelectCancel = () => {
    setShowGDPRWarning(false);
  };

  const getKey = (llm: LLM | null | undefined): string => {
    if (!llm) return "";
    return llm.provider + llm.name;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger 
          className={cn(
            "w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        >
          <SelectValue placeholder="Loading embedding models..." />
        </SelectTrigger>
      </Select>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <Select disabled>
        <SelectTrigger 
          className={cn(
            "w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        >
          <SelectValue
            placeholder={`Error: ${error instanceof Error ? error.message : "Unknown error"}`}
          />
        </SelectTrigger>
      </Select>
    );
  }

  // Handle empty state
  if (embeddingModels.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger 
          className={cn(
            "w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        >
          <SelectValue placeholder="No embedding models available" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div>
      <Select
        value={getKey(selectedEmbedding) ?? ""}
        onValueChange={onSelectEmbedding}
      >
        <SelectTrigger 
          className={cn(
            "w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "cursor-pointer"
          )}
        >
          <SelectValue placeholder="Select an embedding model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select an embedding model</SelectLabel>
            {embeddingModels.map((model) => (
              <SelectItem 
                key={getKey(model)} 
                value={getKey(model)}
                className="cursor-pointer"
              >
                {model.provider}: {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <AlertDialog open={showGDPRWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Data Privacy Notice</AlertDialogTitle>
            <AlertDialogDescription>
              This selected embedding model may not fully comply with GDPR requirements
              and should be avoided in scenarios involving sensitive or
              regulated personal data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={warningSelectCancel} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={warningSelectContinue} className="cursor-pointer">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
