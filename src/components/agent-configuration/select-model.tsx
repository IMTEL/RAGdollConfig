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

import { useEffect, useMemo, useRef, useState } from "react";

import { LLM } from "@/app/(main)/agents/agent_data";
import axios from "axios";

const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/app";
const appApi = (path: string) => `${APP_BASE_PATH}${path}`;

interface SelectAgentProps {
  selectedModel?: LLM | null;
  onChange?: (model: LLM | null) => void;
  allowedProviders?: string[];
  provider?: string | null;
  apiKey?: string | null;
  isApiKeyLoading?: boolean;
  apiKeyError?: string | null;
  disabled?: boolean;
}

export function SelectModel({
  selectedModel,
  onChange,
  allowedProviders,
  provider,
  apiKey,
  isApiKeyLoading,
  apiKeyError,
  disabled,
}: SelectAgentProps) {
  const [showGDPRWarning, setShowGDPRWarning] = useState<boolean>(false);
  const [pendingModel, setPendingModel] = useState<LLM | null>(null);
  const [models, setModels] = useState<LLM[] | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const lastRequest = useRef<{ provider: string; apiKey: string } | null>(null);

  const normalizedAllowedProviders = useMemo(() => {
    if (!allowedProviders?.length) return null;
    return allowedProviders.map((provider) => provider.toLowerCase());
  }, [allowedProviders]);

  useEffect(() => {
    if (!provider || !apiKey) {
      if (selectedModel) {
        onChange?.(null);
      }
      setModels(null);
      setFetchError(null);
      setIsLoadingModels(false);
      lastRequest.current = null;
      return;
    }

    const normalizedProvider = provider.toLowerCase().trim();
    const requestSignature = { provider: normalizedProvider, apiKey };
    lastRequest.current = requestSignature;
    let cancelled = false;

    const loadModels = async () => {
      setIsLoadingModels(true);
      setFetchError(null);
      try {
        const response = await axios.post(appApi("/api/get-models"), {
          provider: normalizedProvider,
          apiKey,
        });
        if (cancelled) return;

        const data = response.data;
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }
        if (
          lastRequest.current?.provider === normalizedProvider &&
          lastRequest.current?.apiKey === apiKey
        ) {
          setModels(data as LLM[]);
        }
      } catch (error) {
        if (cancelled) return;
        setModels([]);
        if (axios.isAxiosError(error)) {
          const message =
            (error.response?.data as { error?: string })?.error ??
            error.message;
          setFetchError(message ?? "Failed to load models");
        } else if (error instanceof Error) {
          setFetchError(error.message);
        } else {
          setFetchError("Failed to load models");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingModels(false);
        }
      }
    };

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, [apiKey, onChange, provider, selectedModel]);

  const filteredModels = useMemo(() => {
    if (!models) return null;
    if (!normalizedAllowedProviders?.length) return models;
    return models.filter((model) =>
      normalizedAllowedProviders.includes(model.provider.toLowerCase())
    );
  }, [models, normalizedAllowedProviders]);

  useEffect(() => {
    if (!selectedModel) return;
    if (!filteredModels) return;
    const stillAvailable = filteredModels.some(
      (model) => getKey(model) === getKey(selectedModel)
    );
    if (!stillAvailable) {
      onChange?.(null);
    }
  }, [filteredModels, onChange, selectedModel]);

  const onSelectModel = (value: string) => {
    const model =
      filteredModels?.find((item) => getKey(item) === value) ?? null;

    if (!model?.GDPR_compliant) {
      setShowGDPRWarning(true);
      setPendingModel(model);
      return;
    }
    onChange?.(model);
  };

  const warningSelectContinue = () => {
    setShowGDPRWarning(false);
    onChange?.(pendingModel);
  };

  const warningSelectCancel = () => {
    setShowGDPRWarning(false);
  };

  const getKey = (llm: LLM | null | undefined): string => {
    if (!llm) return "";
    return llm.provider + llm.name;
  };

  const selectDisabled =
    disabled ||
    !provider ||
    !apiKey ||
    isApiKeyLoading ||
    filteredModels === null ||
    filteredModels.length === 0 ||
    !!fetchError;

  useEffect(() => {
    if (fetchError && selectedModel) {
      onChange?.(null);
    }
  }, [fetchError, onChange, selectedModel]);

  const placeholderText = (() => {
    if (isApiKeyLoading) return "Loading API key...";
    if (apiKeyError) return apiKeyError;
    if (!provider || !apiKey) return "Select an API key first";
    if (isLoadingModels) return "Loading models...";
    if (fetchError) return fetchError;
    if (filteredModels !== null && filteredModels.length === 0)
      return "No models available";
    if (models === null) return "Loading models...";
    return "Select an LLM";
  })();

  return (
    <div>
      <div>
        <Select
          value={getKey(selectedModel) ?? ""}
          onValueChange={onSelectModel}
          disabled={selectDisabled}
        >
          <SelectTrigger className="w-full">
            {isLoadingModels ? (
              <span className="text-muted-foreground">{placeholderText}</span>
            ) : (
              <SelectValue placeholder={placeholderText} />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Select an LLM</SelectLabel>
              {fetchError ? (
                <div className="text-muted-foreground px-3 py-2 text-sm">
                  {fetchError}
                </div>
              ) : Array.isArray(filteredModels) && filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <SelectItem key={getKey(model)} value={getKey(model)}>
                    {model.provider + ": " + model.name}
                  </SelectItem>
                ))
              ) : (
                <div className="text-muted-foreground px-3 py-2 text-sm">
                  No models available
                </div>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={showGDPRWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Data Privacy Notice</AlertDialogTitle>
            <AlertDialogDescription>
              This selected model may not fully comply with GDPR requirements
              and should be avoided in scenarios involving sensitive or
              regulated personal data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={warningSelectCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={warningSelectContinue}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
