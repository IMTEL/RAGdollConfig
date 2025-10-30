"use client";

import { AgentUIState } from "@/app/(main)/agents/agent_data";
import axios from "axios";
import { Bot, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { AccessKey } from "./access-key-card";
import { fa } from "zod/v4/locales";
import { boolean } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const CHAT_WEBSITE_URL =
  process.env.NEXT_PUBLIC_CHAT_WEBSITE_URL || "http://localhost:3001";

interface DeleteAgentProps {
  agent: AgentUIState;
  onSuccess: () => void;
}



export function DeleteAgent({ agent, onSuccess }: DeleteAgentProps) {


  const [processingRequest, setProcessingRequest] = useState<boolean | undefined>(false);
  const [displayAlert, setDisplayAlert] = useState<boolean | undefined>(false);

  const deleteAgent = async () => {
    const params = new URLSearchParams({ agent_id: agent.id });

    const response = await axios.get("/api/delete-agent", {
      params: { agentId: agent.id },
    });

    if (response.status !== 200) {
      console.error(
        "Could not fetch  access-keys : " + response.status.toString()
      );
      throw Error("An error occured while trying to delete agent")
    }
  };


  const handleDelete = async () => {
    if (processingRequest) {
      console.error("Waiting for response from server")
      return
    }
    setProcessingRequest(true)
    try {
      await deleteAgent()
      onSuccess()
    } catch {
      setProcessingRequest(false)
      setDisplayAlert(false)
    }

  };

  useEffect(() => {}, []);

  return (
    <div>
    <Button variant="outline" onClick={() =>{setDisplayAlert(true)}}
      className="bg-red-600 hover:bg-red-700 text-white border-none">
      <Trash className="mr-2 h-4 w-4" />
      Delete Agent
    </Button>


    <AlertDialog open={displayAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            agent and remove agent data data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() =>{setDisplayAlert(false)}}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>



  );
}
