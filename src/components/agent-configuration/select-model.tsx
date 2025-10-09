"use client"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useState } from "react";
import { LLM } from "@/app/agents/agent_data";

interface SelectAgentProps {
    models: LLM[];
    selectedModel?: LLM | null
    onChange?: (model: LLM | null) => void;
}

export function SelectModel({ models, selectedModel, onChange }: SelectAgentProps) {

    const [showGDPRWarning, setShowGDPRWarning] = useState<boolean>(false);
    const [pendingModel, setPendingModel] = useState<LLM | null>(null);

    const onSelectModel = (value: string) => {
        const model = models.find(model => model.id.toString() === value) ?? null

        if (!model?.GDPRCompliant) {
            setShowGDPRWarning(true)
            setPendingModel(model)
            return
        }
        onChange?.(model)
    }

    const warningSelectContinue = () => {
        setShowGDPRWarning(false)
        onChange?.(pendingModel)
    }

    const warningSelectCancel = () => {
        setShowGDPRWarning(false)
    }

    return (
        <div>
            <div>
                <Select value={selectedModel?.id.toString() ?? ""} onValueChange={onSelectModel} >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a LLM" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Select an LLM</SelectLabel>
                            {models.map(model =>
                                <SelectItem key={model.id} value={model.id.toString()}>{model.name}</SelectItem>
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
                            This selected model may not fully comply with GDPR requirements and should be avoided in scenarios involving sensitive or regulated personal data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={warningSelectCancel}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={warningSelectContinue}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}