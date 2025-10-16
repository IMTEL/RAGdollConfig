import * as React from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { agentsClient, AgentUIState, defaultAgent, LLM } from "@/app/agents/agent_data";
import { SelectEmbedding } from "./select-embedding";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [embeddingModel, setEmbeddingModel] = React.useState<LLM | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showValidationAlert, setShowValidationAlert] = React.useState(false);

  const tryCreateAgent = async (name : string, description : string, embeddingModel: string): Promise<AgentUIState | null> =>  {
    try {
      return await agentsClient.createNewAgent(name,description,embeddingModel)
    } catch(e) {
      alert("Failed to create a new agent: " + e);
      console.error(e)
      return null
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (loading) return
    
    // Validate embedding model is selected
    if (!embeddingModel) {
      setShowValidationAlert(true);
      return;
    }
    
    setLoading(true)
    
    const agent = await tryCreateAgent(name, description, embeddingModel.provider + ":" + embeddingModel.name)
    if (agent) {
      // Update the agent with the selected embedding model
      onCreate(agent);
    }
    setIcon("");
    setName("");
    setDescription("");
    setEmbeddingModel(null);
    onClose();
    setLoading(false)
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center bg-black/40"
      )}
    >
      <div
        className={cn("bg-background rounded-lg shadow-lg p-6 w-full max-w-md")}
      >
        <h2 className={cn("text-lg font-semibold mb-4")}>Create Agent</h2>
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
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <SelectEmbedding
            selectedEmbedding={embeddingModel}
            onChange={(embedding) => setEmbeddingModel(embedding)}
          />
          <div className={cn("flex justify-end gap-2")}>
            <button
              type="button"
              className={cn(
                "px-4 py-2 rounded-md bg-muted text-foreground cursor-pointer"
              )}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "px-4 py-2 rounded-md bg-primary text-primary-foreground cursor-pointer"
              )}
            >
              Create
            </button>
          </div>
        </form>
      </div>

      <AlertDialog open={showValidationAlert} onOpenChange={setShowValidationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Embedding Model Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please select an embedding model before creating the agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationAlert(false)} className="cursor-pointer">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
