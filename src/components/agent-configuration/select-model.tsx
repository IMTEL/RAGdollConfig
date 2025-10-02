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

import { useEffect, useState } from "react";

export interface LLM {
  provider: string;
  name: string;
  GDPR_compliant: boolean | null;
  description: string | null;
}

interface SelectAgentProps {
  selectedModel?: LLM | null;
  onChange?: (model: LLM | null) => void;
}

const RAGDOLL_BASE_URL = process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL;

export function SelectModel({ selectedModel, onChange }: SelectAgentProps) {
  const [showGDPRWarning, setShowGDPRWarning] = useState<boolean>(false);
  const [pendingModel, setPendingModel] = useState<LLM | null>(null);
  const [models, setModels] = useState<LLM[]>([]);

  useEffect(() => {
    fetch(RAGDOLL_BASE_URL + "agentconfig/models")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setModels(data as LLM[]);
      });
  }, []);

  const onSelectModel = (value: string) => {
    const model = models.find((model) => getKey(model) === value) ?? null;

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

  return (
    <div>
      <div>
        <Select
          value={getKey(selectedModel) ?? ""}
          onValueChange={onSelectModel}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a LLM" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Select an LLM</SelectLabel>
              {models.map((model) => (
                <SelectItem key={getKey(model)} value={getKey(model)}>
                  {model.provider + ": " + model.name}
                </SelectItem>
              ))}
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
