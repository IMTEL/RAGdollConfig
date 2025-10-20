import { agentsClient, AgentUIState } from "@/app/(main)/agents/agent_data";
import { cn } from "@/lib/utils";
import * as React from "react";
import { Input } from "../ui/input";

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
  const [loading, setLoading] = React.useState(false);

  const tryCreateAgent = async (name: string, description: string): Promise<AgentUIState | null> => {
    try {
      return await agentsClient.createNewAgent(name, description)
    } catch (e) {
      alert("Failed to create a new agent: " + e);
      console.error(e)
      return null
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    if (loading) return
    setLoading(true)

    e.preventDefault();
    const agent = await tryCreateAgent(name, description)
    if (agent) onCreate(agent);
    setIcon("");
    setName("");
    setDescription("");
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
    </div>
  );
}
