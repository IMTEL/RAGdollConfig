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

import { useEffect, useMemo, useState } from "react";

import { LLM } from "@/app/(main)/agents/agent_data";
import axios from "axios";

interface SelectAgentProps {
  selectedModel?: LLM | null;
  onChange?: (model: LLM | null) => void;
  allowedProviders?: string[];
  disabled?: boolean;
}

export function SelectModel({
  selectedModel,
  onChange,
  allowedProviders,
  disabled,
}: SelectAgentProps) {
  const [showGDPRWarning, setShowGDPRWarning] = useState<boolean>(false);
  const [pendingModel, setPendingModel] = useState<LLM | null>(null);
  const [models, setModels] = useState<LLM[] | null>(null);

  const normalizedAllowedProviders = useMemo(() => {
    if (!allowedProviders?.length) return null;
    return allowedProviders.map((provider) => provider.toLowerCase());
  }, [allowedProviders]);

  useEffect(() => {
    const getModels = async () => {
      const response = await axios.get("/api/get-models");
      if (response.status !== 200) {
        console.error("Failed to load models");
      }
      const data = await response.data;
      setModels(data as LLM[]);
    };
    getModels();
  }, []);

  const filteredModels = useMemo(() => {
    if (!models) return null;
    if (!normalizedAllowedProviders?.length) return models;
    return models.filter((model) =>
      normalizedAllowedProviders.includes(model.provider.toLowerCase())
    );
  }, [models, normalizedAllowedProviders]);

  useEffect(() => {
    if (!selectedModel) return;
    if (!normalizedAllowedProviders?.length) return;
    if (
      !normalizedAllowedProviders.includes(selectedModel.provider.toLowerCase())
    ) {
      onChange?.(null);
    }
  }, [normalizedAllowedProviders, onChange, selectedModel]);

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
    disabled || filteredModels === null || filteredModels.length === 0;

  const placeholderText = (() => {
    if (models === null) return "Loading models...";
    if (filteredModels !== null && filteredModels.length === 0)
      return "No models available";
    return "Select a LLM";
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
            {models === null ? (
              <span className="text-muted-foreground">{placeholderText}</span>
            ) : (
              <SelectValue placeholder={placeholderText} />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Select an LLM</SelectLabel>
              {Array.isArray(filteredModels) && filteredModels.length > 0 ? (
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
