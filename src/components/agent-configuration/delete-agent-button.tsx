"use client";

import { AgentUIState } from "@/app/(main)/agents/agent_data";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

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

const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/app";
const appApi = (path: string) => `${APP_BASE_PATH}${path}`;

interface DeleteAgentProps {
  agent: AgentUIState;
  onSuccess: () => void;
}

export function DeleteAgent({ agent, onSuccess }: DeleteAgentProps) {
  const [processingRequest, setProcessingRequest] = useState(false);
  const [displayAlert, setDisplayAlert] = useState(false);
  const router = useRouter();

  const deleteAgent = async () => {
    const response = await axios.get(appApi("/api/delete-agent"), {
      params: { agentId: agent.id },
    });

    if (response.status !== 200) {
      console.error("Could not delete agent: " + response.status.toString());
      throw Error("An error occurred while trying to delete agent");
    }
  };

  const handleDelete = async () => {
    if (processingRequest) {
      console.error("Waiting for response from server");
      return;
    }
    setProcessingRequest(true);
    try {
      await deleteAgent();
      onSuccess();
      router.push("/agents");
    } catch {
      setProcessingRequest(false);
      setDisplayAlert(false);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDisplayAlert(true);
        }}
        className="bg-transparent transition-colors hover:bg-red-500 hover:text-white"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={displayAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent and remove agent data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDisplayAlert(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
